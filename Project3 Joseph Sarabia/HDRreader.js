/*
Author: Sumanta Pattanaik
date: 11/21/2012
For CAP5725 class use only.
*/
'use strict';
function HDRdata(type,data,w,h,flipflag){
	if (!type){alert("Missing HDR data type"); return;}
	this.type = type;
	this.data = (data)?data:[];
	this.width = (w)?w:0;
	this.height = (h)?h:0;
	this.flipped = (flipflag)?flipflag:false;
}
function HDRimage(){
	var EPSILON = 0.00001;
	this.thetaphi2xyz=function(theta,phi){
		//return [Math.cos(phi) * Math.sin(theta),Math.cos(theta),Math.sin(phi) * Math.sin(theta)];
		return [Math.cos(phi) * Math.sin(theta),Math.sin(phi) * Math.sin(theta),Math.cos(theta)];
	}
	this.direction2texCoord=function(d) {
		// The following equation is not a standard coversion from a OpenGL sphere map which is:
		// float r = 1.0f/sqrt(d.x*d.x + d.y*d.y + (d.z+1.0)*(d.z+1.0));
		// Rather this uses the probemap conversion method.
		var r = (1.0/Math.PI)*Math.acos(d[2])/Math.sqrt(d[0]*d[0] + d[1]*d[1]+EPSILON);
		return [0.5*d[0]*r + 0.5, 0.5*d[1]*r + 0.5];
	}		
	this.bilinearInterpolate=function(img,theta,phi){
		function linearInterop(lo,hi,s){
			return [lo[0]*(1.0-s) + hi[0]*s,lo[1]*(1.0-s) + hi[1]*s,lo[2]*(1.0-s) + hi[2]*s];
		}
		function getVec(index){
			return [buffer[index*3+0],buffer[index*3+1],buffer[index*3+2]];
		}
		var dir=this.thetaphi2xyz(theta,phi);
		var buffer = img.data, st = this.direction2texCoord(dir); var w = img.width, h = img.height;
		var x = st[0]*w, y = st[1]*h;
		var xpos = [Math.floor(x), Math.min(Math.ceil(x),w-1)];
		var ypos = [Math.floor(y), Math.min(Math.ceil(y),h-1)];

		var s = x-Math.floor(x);
		var loIndex = ypos[0]*w+xpos[0];
		var hiIndex = ypos[0]*w+xpos[1];
		var cLo = linearInterop(getVec(loIndex),getVec(hiIndex),s);
		loIndex = ypos[1]*w+xpos[0];
		hiIndex = ypos[1]*w+xpos[1];
		var cHi = linearInterop(getVec(loIndex),getVec(hiIndex),s);

		var t = y-Math.floor(y);
		return linearInterop(cLo,cHi,t);
	}
	this.convertprobetoThetaPhiMap=function(img,w,h) //img: is an object of HDRdata type
	{
		if (img.type != "probemap"){alert("Input HDRdata type must be 'probemap'."); return;}
		var newdata = new Float32Array(w*h*3);		
		var thetainc = (1.0/h) * Math.PI;
		var phiinc = (1.0/w) * Math.PI * 2.0;

		var index=0;
		var theta=thetainc/2.0;
		for (var i=0; i < h; i++) {
			var phi=phiinc/2.0;
			for (var j=0; j < w; j++) {
				var val = this.bilinearInterpolate(img,theta,phi);
				newdata[index*3+0] = val[0];newdata[index*3+1] = val[1];newdata[index*3+2] = val[2]; index++;
				phi+=phiinc;
			}
			theta+=thetainc; 
		}
		return new HDRdata("thetaphimap",newdata,w,h);
	}
	this.readFile=function(path, flipFlag) 
	{
		var img=new HDRdata("probemap");
		var xhr = new XMLHttpRequest();
		xhr.open('GET', path, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) {
			function rgbe2float(r,g,b,e){
				if (e) {   /*nonzero pixel*/
					var f = Math.pow(2,e-(128+8));
					return[r * f, g * f, b * f];
				}
				else
					return [0,0,0];
			}
			function readPixels(index,n){
				for (var i=0; i<n; i++, offset+=4, index+=3){
					rgbe=rgbe2float(data[offset],data[offset+1],data[offset+2],data[offset+3]);
					imagedata[index]=rgbe[0];imagedata[index+1]=rgbe[1];imagedata[index+2]=rgbe[2];
				}
			}
			
			function readPixelsRLE(){
				var index = 0,i,j,ptr,ptr_end,count;
				if ((width < 8)||(width > 0x7fff)){// run length encoding is not allowed so read flat
					console.log("Not Runlength encoded");
					readPixels(index,width*height);
					return;
				}
				var scanline_buffer = [];
				var num_scanlines = height;
				/* read in each successive scanline */
				var maxVals = [0,0,0];
				while(num_scanlines > 0) {
					if ((data[offset] != 2)||(data[offset+1] != 2)||(data[offset+2] & 0x80)) {
						// this file is not run length encoded 
						console.log("Not Runlength encoded");
						readPixels(index,width*num_scanlines);
						return;
					}
					if ((data[offset+2]<<8 | data[offset+3]) != width) {
						alert("rgbe_format_error: wrong scanline width");
						return;
					}
					offset+=4;
					// read each of the four channels for the scanline into the buffer
					for(i=0;i<4;i++) {
						scanline_buffer[i]=[];
						ptr_end = width;
						ptr = 0;
						while(ptr < ptr_end) {
							if (data[offset] > 128) {
								// a run of the same value
								count = data[offset]-128;
								if ((count == 0)||(count > width - ptr)) {
									alert("rgbe_format_error: bad scanline data 1:"+count+" "+(width-ptr));
									return;
								}
								while(count-- > 0)
									scanline_buffer[i][ptr++] = data[offset+1];
								offset+=2;
							}
							else {
							  // a non-run 
							  count = data[offset];
							  if ((count == 0)||(count > ptr_end - ptr)) {
								alert("rgbe_format_error: bad scanline data 2");
							  }
							  scanline_buffer[i][ptr++] = data[offset+1];
							  offset+=2;
							  if (--count > 0) {
								for (j=0;j<count;j++,ptr++,offset++)
									scanline_buffer[i][ptr]=data[offset];
							  }
							}
						}
					}
					// now convert data from buffer into floats 
					for(i=0;i<width;i++,index+=3) {
						var rgbe=rgbe2float(scanline_buffer[0][i],scanline_buffer[1][i],scanline_buffer[2][i],scanline_buffer[3][i]);
						imagedata[index]=rgbe[0];imagedata[index+1]=rgbe[1];imagedata[index+2]=rgbe[2];
						if (maxVals[0]<rgbe[0])maxVals[0]=rgbe[0];
						if (maxVals[1]<rgbe[1])maxVals[1]=rgbe[1];
						if (maxVals[2]<rgbe[2])maxVals[2]=rgbe[2];
					}
					num_scanlines--;
				}
				/*
				for (i=0;i<index; i+=3){
					imagedata[i]/=maxVals[0];imagedata[i+1]/=maxVals[1];imagedata[i+2]/=maxVals[2];
				}
				*/
				console.log(maxVals);
			}
			function readHeader(){
				var line = [];
				//Magic number: 23 3f 52 41 44 49 41 4e 43 45 0a
				if (data[offset]==0x23){
					for (i=0; i<11; i++) line[i]=data[offset+i].toString(16);
					//console.log("Magic Number: "+line);
					offset += 11;
				}
				else alert("missing magic number in the header.");
				while (data[offset]!=0x2D){ // 0x2D = "-".loop till -Y height +X width found
					line=[]; i = 0;
					while(data[offset]!=0x0A){
						line[i] = String.fromCharCode(data[offset]); i++; offset++;
					}
					offset++;
					//console.log(line.join(""));
				}
				offset+=3;
				line=[];
				while(data[offset]!=0x20){line[i] = String.fromCharCode(data[offset]); i++; offset++;}
				width = parseInt(line.join(""));
				offset+=3;
				line=[];
				while(data[offset]!=0x0A){line[i] = String.fromCharCode(data[offset]); i++; offset++;}
				offset++
				height = parseInt(line.join(""));
			}
			function flipIt(){
				var topRowData=[];
				var bottomRowData=[];
				function memcpy(dst,dIndex,src,sIndex,n){
					for (var i=0; i <n; i++){
						dst[dIndex+i] = src[sIndex+i];
					}
				}
				for (var i=0; i < Math.floor(height/2); i++){
					memcpy(topRowData,0,imagedata,(i*width*3),(width*3));
					memcpy(bottomRowData,0,imagedata,(height-1-i)*width*3,(width*3));
					memcpy(imagedata,(height-1-i)*width*3,topRowData,0,(width*3));
					memcpy(imagedata,i*width*3,bottomRowData,0,(width*3));
				}
			}
			var data = new Uint8Array(this.response); 
			var i, offset = 0;
			var width,height;
			readHeader();
			//console.log("width: "+width+" height: "+height+" offset: "+offset);
			var imagedata = new Float32Array(width*height*3);
			readPixelsRLE();
			if (flipFlag == 1)flipIt();
			img.data = imagedata; img.width=width; img.height=height; img.flipped = flipFlag;
			console.log("Done: "+ img.width + " " +img.height);
		}
		xhr.send();
		return img;
	}
}
