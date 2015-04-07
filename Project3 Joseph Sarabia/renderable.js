"use strict";


function RenderableModel(gl,model, pathname, img){
	  //var hdr = new HDRimage();
	  //var img = hdr.readFile("stpeters_probe.hdr", true);
	  var hdrtex = null;
	  var irrtex = null;
	  var tpmap = null;
	  //var irrmap= {};
	  loadModelTexture(model);
	  var imagecount=0;

	  //callback until hdr image has loaded, return the texture
	  function setupHDRtexture(){
		  if(!img.data.length){
			  console.log("data not ready");			
			  window.requestAnimationFrame(setupHDRtexture);
		  }
		  else{ 
			  
			  window.hdrtex = createHDRtexture(img);
			  tpmap = hdr.convertprobetoThetaPhiMap(img, img.width, img.height);
			  if(!window.irrmap.data){
			  computeIrradianceMap(tpmap.data);
			  //console.log("hdr tex is" +hdrtex);
			   //console.log("final r is " + window.irrmap.data[0] + "g is " + window.irrmap.data[1] + "b is " + window.irrmap.data[2]);
			  // for(var i = 0; i<irrmap.data.length;i++){
			//	   irrmap.data[i] *= (.6/Math.PI);
			 // }
			  }
			  irrtex = createHDRtexture(window.irrmap);
			   
		  }
	  }

	function computeIrradianceMap(tpmap){
		var map = [];
		var sumx = 0, sumy=0, sumz=0;var index = 0;
		var normtinc = (1.0/64) * Math.PI;
		var normpinc = (1.0/32) * Math.PI * 2.0;
		var thetainc = (1.0/64) * Math.PI;
		var phiinc = (1.0/32) * Math.PI * 2.0;
		
		console.log(tpmap);
		//console.log("tmap 1 is "+tpmap[1]);
		
		for(var n = 0; n < Math.PI; n+= normtinc){
			for(var m = 0; m < 2* Math.PI; m+= normpinc){
				
				//theta
				for(var i = 0;i<Math.PI;i+=thetainc){
					//phi
					for(var j= 0; j< 2 * Math.PI;j+=phiinc){
						
						var dirx = (Math.sin(i)*Math.cos(j));
						var diry = (Math.sin(i)*Math.sin(j));
						var dirz = Math.cos(i);
						var dirmag = Math.sqrt(dirx*dirx + diry*diry + dirz*dirz);
						dirx /= dirmag; diry /= dirmag; dirz /= dirmag; 
						
						
						var normx = (Math.sin(n)*Math.cos(m));
						var normy = (Math.sin(n)*Math.sin(m));
						var normz = Math.cos(n);
						var normmag = Math.sqrt(normx*normx + normy*normy + normz*normz);
						normx /= normmag; normy /= normmag; normz /= normmag;
						
							
						var dotproduct = dirx*normx + diry*normy + dirz*normz;
						
						if(dotproduct > 0){
							var end = dotproduct * Math.sin(i);
							var access = [Math.floor((i/Math.PI)*1500) * 1500 + Math.floor(j/(Math.PI * 2) * 1500)] * 3
							sumx += tpmap[access] * end;
							sumy += tpmap[access+1] * end;				
							sumz += tpmap[access+2] * end;
							
							//console.log("dotproduct is" + dotproduct);
						}

					}
				}
				//sum * delta theta delta phi
				map[index*3] = sumx * phiinc * thetainc;
				map[(index*3)+1] = sumy * phiinc * thetainc;
				map[(index*3)+2] = sumz * phiinc * thetainc;
				//console.log("r is " + (sumx * phiinc * thetainc) + "g is " + (sumy * phiinc * thetainc) + "g is " + (sumy * phiinc * thetainc));
				//console.log("r is " + map[index*3] + "g is " + map[(index*3)+1] + "b is " + map[(index*3)+2]);
				index++;
				sumx = 0; sumy = 0; sumz = 0;
				
			}
			//index = 0;
			
		}
		window.irrmap.data = map;
		window.irrmap.width = 64;
		window.irrmap.height = 32;
	}



	
	function createHDRtexture(img)
	{
		if(img.data.length)
			console.log("loading fine, length is " + img.data.length);
		
		console.log("height is " + img.height + "width is " + img.width);
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB, img.width, img.height, 0, gl.RGB, gl.FLOAT, new Float32Array(img.data));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
		console.log(tex);
		return tex;
	}
	
	function Drawable(attribLocations, diffuse, specular, shininess, vArrays, nVertices, indexArray, drawMode, tex, hdrtex){
	  // Create a buffer object
	  var vertexBuffers=[];
	  var nElements=[];
	  var nAttributes = attribLocations.length;
	  var diffuse;
	  var specular;
	  var shininess;
	  this.diffuse = diffuse;
	  this.shininess = shininess;
	  this.specular = specular;
	  this.tex = tex;


	  //for (var i=0; i<2; i++){
	  for (var i=0; i<nAttributes; i++){
		  if (vArrays[i]){
			  vertexBuffers[i] = gl.createBuffer();
			  if (!vertexBuffers[i]) {
				//console.log('Failed to create the buffer object');
				return null;
			  }
			  // Bind the buffer object to an ARRAY_BUFFER target
			  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
			  // Write date into the buffer object
			  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vArrays[i]), gl.STATIC_DRAW);
			  //console.log("varrays is " + vArrays[2].length);
			  nElements[i] = vArrays[i].length/nVertices;
		  }
		  else{
			  vertexBuffers[i]=null;
		  }
	  }

	  var indexBuffer=null;
	  if (indexArray){
		indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
	  }
	  
		
	  
	  this.draw = function (){
		for (var i=0; i<nAttributes; i++){
		  if (vertexBuffers[i]){
			  gl.enableVertexAttribArray(attribLocations[i]);
			  // Bind the buffer object to target
			  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
			  // Assign the buffer object to a_Position variable
			  //if(i == 2)
				 // console.log("nelems is "+ nElements[i] + "I is " + i);
			  gl.vertexAttribPointer(attribLocations[i], nElements[i], gl.FLOAT, false, 0, 0);
		  }
		  
		  else{
			  gl.disableVertexAttribArray(attribLocations[i]); 
			  gl.vertexAttrib3f(attribLocations[i],1,1,1);
			  //console.log("Missing "+attribLocations[i]);
		  }
		}
		if (!window.hdrtex) console.log("null hdrtex");
		if (!img.data.length) console.log("null img");
		if (!window.hdrtex && img.data.length) window.hdrtex = createHDRtexture(img);
		//console.log(model.materials[i].diffuseTexObj);
		if(irrtex){
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D,irrtex);
			gl.uniform1i(sampler2Loc, 2);
		}

		if(window.hdrtex){
		  //console.log("getting here");
		  gl.activeTexture(gl.TEXTURE3);
		  gl.bindTexture(gl.TEXTURE_2D,window.hdrtex);
		  gl.uniform1i(sampler3Loc, 3);
		}
		
		if(tex){
			gl.activeTexture(gl.TEXTURE1);
		  	gl.bindTexture(gl.TEXTURE_2D,tex);
		  	gl.uniform1i(samplerLoc, 1);			
		}
		
		if (indexBuffer){
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.drawElements(drawMode, indexArray.length, gl.UNSIGNED_SHORT, 0);
		}
		else{
			gl.drawArrays(drawMode, 0, nVertices);
		}
	  }
	}

	
		function loadModelTexture(modelData)
		{
			var imageDictionary={};
			for (var i=0; i<modelData.materials.length;i++){	
				if (modelData.materials[i].diffuseTexture){
					var filename=modelData.materials[i].diffuseTexture[0];
					console.log(filename);
					if (imageDictionary[filename]===undefined){
					  imageDictionary[filename] = setTexture(gl,pathname+filename);
					}
					modelData.materials[i].diffuseTexObj = imageDictionary[filename];
					//console.log("number of textures loaded "+model.materials[i].diffuseTexObj.length);
				}
			}

		}
		function setTexture(gl,textureFileName)
		{
			var tex = gl.createTexture();
			tex.width = 0; tex.height = 0;

			var img = new Image();
			imagecount++;
			console.log(textureFileName);
			
			
			
			img.onload = function(){
				function isPowerOfTwo(x) {
					return (x & (x - 1)) == 0;
				}
				var nPOT = false; // nPOT: notPowerOfTwo
				console.log(textureFileName+" loaded : "+img.width+"x"+img.height);
				tex.complete = img.complete;
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, tex);
				if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) nPOT = true;
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
				//void texImage2D(enum target, int level, enum internalformat, enum format, enum type, Object object);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, (nPOT)?gl.CLAMP_TO_EDGE:gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, (nPOT)?gl.CLAMP_TO_EDGE:gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, ((nPOT)?gl.LINEAR:gl.LINEAR_MIPMAP_LINEAR));
				if (!nPOT)gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);
				tex.width = img.width;
				tex.height = img.height;
				imagecount--; 
			};
			img.src = textureFileName;
			return tex;
		}

	var VSHADER_SOURCE =
		'attribute vec3 position;\n' +
		'attribute vec3 normal;\n' +
		'uniform vec4 diffuse, specular;\n' +
		'uniform vec3 eye;'+
		'attribute vec2 texCoord;' +
		'varying vec2 tCoord;' +
		//'attribute vec3 normal;\n' +
		//'uniform mat4 mvpT;'+
		'uniform mat4 modelT, viewT, projT, normT, normWT;'+
		'uniform int spotON, shininess, irr;'+
		'uniform float spot_angle;'+
		'varying vec3 fnormal, fnormW, fpos, eyeW;'+
		'void main() {\n' +
		//'  gl_Position = modelT*vec4(position,1.0);\n' +
		'	gl_Position = projT*viewT*modelT*vec4(position,1.0);\n' +
		'	fnormal = (normT*vec4(normal,0.0)).xyz;\n'+
		'	fnormW = (normalize(normWT*vec4(normal,0.0)).xyz);\n'+
		'	fpos = (modelT*vec4(position, 1.0)).xyz;'+
		'	eyeW = (modelT*vec4(eye,1.0)).xyz;'+
		//'	fpos = (viewT*modelT*vec4(position,1.0)).xyz;'+
		//'	r = (vec4((modelT*vec4(position,1.0)).xyz)), normalize(fnormal));'+
		'	tCoord = texCoord;'+	
		'}\n';

	// Fragment shader program
	var FSHADER_SOURCE =
		'precision mediump float;' +
		'uniform vec4 diffuse, specular;' +
		'uniform int spotON, shininess, irr, mirror, surf;' +
		'uniform float spot_angle, exposure;'+
		'varying vec3 fnormal, fpos, fnormW, eyeW;' +
		//sampler is surface, sampler2 is irradiance, sampler 3 is mirror
		'uniform sampler2D sampler, sampler2, sampler3;\n'+
		'varying vec2 tCoord;\n'+

		'void main() {\n' + 
			'\n' +
			'vec3 normNormal = normalize(fnormal.xyz);'+
			'vec3 normNormalW = normalize(fnormW).xyz;'+
			'vec3 color = vec3(0.0,0.0,0.0);'+
			
			'if (irr == 1)'+
			'{'+
			'	vec3 d = normNormalW;'+
			//switch these depending on coordinate transformations
			'	vec2 diffst = vec2(atan(normNormalW.y, normNormalW.x)/3.14, acos(normNormalW.z)/3.14);'+
			//'	vec2 diffst = vec2(atan(normNormalW.x, normNormalW.y)/3.14, acos(normNormalW.z)/6.28);'+
			'	vec3 difftex = texture2D(sampler2, diffst).rgb;'+
			'	difftex = vec3(difftex.x*(diffuse.x/3.14), difftex.y*(diffuse.y/3.14), difftex.z*(diffuse.z/3.14));'+
			'	color = vec3(color.xyz + difftex.xyz);'+
			'}'+
		
			'if (mirror == 1)'+
			'{'+
			'	vec3 dm = reflect(-normalize(eyeW-fpos), normNormalW);'+
			'	float r = (1.0/3.14)* acos(dm.z)/sqrt(dm.x*dm.x + dm.y*dm.y+.0000001);'+
			'	vec2 st = vec2((((dm.x*r+1.0)/2.0)), ((dm.y*r+1.0)/2.0));'+
			'	vec3 mirrtex = texture2D(sampler3, st).rgb;'+
			'	color = vec3(color.xyz + mirrtex.xyz);'+
			'}'+
		
			'if(surf == 1)'+
			'{'+
			'	vec3 surftex = texture2D(sampler, tCoord).rgb;'+
			'	color = vec3(color.x*surftex.x, color.y*surftex.y, color.z*surftex.z);'+
			'}'+
			'gl_FragColor = vec4(exposure*color, 1.0);'+

		'}\n';
	var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
	if (!program) {
		alert('Failed to create program');
		return false;
	}
	//else console.log('Shader Program was successfully created.');
	var a_Position = gl.getAttribLocation(program, 'position');		  
	var a_Normal = gl.getAttribLocation(program, 'normal');
	var a_Texture = gl.getAttribLocation(program, 'texCoord');
	var a_Locations = [a_Position,a_Normal, a_Texture];
	//console.log(a_Locations);
	// Get the location/address of the uniform variable inside the shader program.
	var mmLoc = gl.getUniformLocation(program,"modelT");
	var normLoc = gl.getUniformLocation(program,"normT");
	var normWorldLoc = gl.getUniformLocation(program, "normWT");
	var vmLoc = gl.getUniformLocation(program,"viewT");
	var pmLoc = gl.getUniformLocation(program,"projT");
	var diffLoc = gl.getUniformLocation(program, "diffuse");
	var specLoc = gl.getUniformLocation(program, "specular");
	var shininessLoc = gl.getUniformLocation(program, "shininess");
	var spotAngleLoc = gl.getUniformLocation(program, "spot_angle");
	var exposureLoc = gl.getUniformLocation(program, "exposure");
	var spotONLoc = gl.getUniformLocation(program, "spotON");
	var surfLoc = gl.getUniformLocation(program, "surf");
	var mirrorLoc = gl.getUniformLocation(program, "mirror");
	var irrLoc = gl.getUniformLocation(program, "irr");
	var eyeLoc = gl.getUniformLocation(program, "eye");
	var samplerLoc=gl.getUniformLocation(program,"sampler");
	var sampler2Loc=gl.getUniformLocation(program,"sampler2");
	var sampler3Loc=gl.getUniformLocation(program,"sampler3");
	//var mvpLoc = gl.getUniformLocation(program,"mvpT");
	
	var drawables=[];
	var modelTransformations=[];
	var nDrawables=0;
	var nNodes = (model.nodes)?model.nodes.length:1;
	var drawMode=(model.drawMode)?gl[model.drawMode]:gl.TRIANGLES;
	hdrtex = setupHDRtexture();
	for (var i= 0; i<nNodes; i++){
		var nMeshes = (model.nodes)?(model.nodes[i].meshIndices.length):(model.meshes.length);
		for (var j=0; j<nMeshes;j++){
			var index = (model.nodes)?model.nodes[i].meshIndices[j]:j;
			var mesh = model.meshes[index];
			if(model.materials){
				var specular = model.materials[mesh.materialIndex].specularReflectance;
				var diffuse = model.materials[mesh.materialIndex].diffuseReflectance;
			
				if(specular[0] == 0.0 && specular[1] == 0.0 && specular[2] == 0.0)
					specular = diffuse;
				var shininess = model.materials[mesh.materialIndex].shininess;
			}
			if(mesh.vertexTexCoordinates){
			drawables[nDrawables] = new Drawable(
				a_Locations, diffuse, specular, shininess, [mesh.vertexPositions, mesh.vertexNormals, mesh.vertexTexCoordinates[0]],
				mesh.vertexPositions.length/3,
				mesh.indices, drawMode, model.materials[mesh.materialIndex].diffuseTexObj,hdrtex
			);
			}
			else if (model.materials){
				drawables[nDrawables] = new Drawable(
				a_Locations, diffuse, specular, shininess, [mesh.vertexPositions, mesh.vertexNormals],
				mesh.vertexPositions.length/3,
				mesh.indices, drawMode
			);
			}
			else {
				drawables[nDrawables] = new Drawable(
				a_Locations, [0.5,0.5,0.5,0.0], [0.0,0.0,0.0,0.0], 1, [mesh.vertexPositions, mesh.vertexNormals],
				mesh.vertexPositions.length/3,
				mesh.indices, drawMode
			);
			}

			//	alert(drawables[0].diffuse);
			var m = new Matrix4();
			if (model.nodes)m.elements=new Float32Array(model.nodes[i].modelMatrix);
			modelTransformations[nDrawables] = m;
			
			nDrawables++;
		}
	}
	// Get the location/address of the vertex attribute inside the shader program.
	this.draw = function (spotangle, spotlight, pMatrix,vMatrix,mMatrix)
	{
		gl.useProgram(program);
		gl.uniform1i(irrLoc, diffON);
		gl.uniform1i(mirrorLoc, mirrorON);
		gl.uniform1i(surfLoc, surfacetex);
		gl.uniform1i(spotONLoc, spotlight);
		gl.uniform1f(spotAngleLoc, spotangle);
		gl.uniform1f(exposureLoc, exposure);
		var eyee;
		eyee = camera.getEye();
		
		
		gl.uniform3fv(eyeLoc, new Float32Array([eyee[0], eyee[1], eyee[2]]));
		//gl.uniform4fv(diffLoc, model.materials[0].diffuseReflectance);
		gl.uniformMatrix4fv(pmLoc, false, pMatrix.elements);
		gl.uniformMatrix4fv(vmLoc, false, vMatrix.elements);
		//var vpMatrix = new Matrix4(pMatrix).multiply(vMatrix); // Right multiply
		for (var i= 0; i<nDrawables; i++){
			//var mMatrix=modelTransformations[i];
			//var mvpMatrix = new Matrix4(vpMatrix).multiply(mMatrix);
			//gl.uniformMatrix4fv(mvpLoc, false, mvpMatrix.elements);
			
			gl.uniformMatrix4fv(mmLoc, false, 
				(mMatrix)?(new Matrix4(mMatrix).multiply(modelTransformations[i])).elements
						:modelTransformations[i].elements);
			var normalMatrixWorld = new Matrix4();
			normalMatrixWorld.multiply(modelTransformations[i]);
			normalMatrixWorld.invert();
			normalMatrixWorld.transpose();
			var normalMatrix = new Matrix4();
			if(mMatrix){
				normalMatrix.multiply(vMatrix);
				normalMatrix.multiply(modelTransformations[i]);
			}
			else{
				normalMatrix.multiply(vMatrix);
				normalMatrix.multiply(modelTransformations[i]);
			}
			normalMatrix.invert();
			normalMatrix.transpose();
			//alert(drawables[i].diffuse);
			gl.uniform4fv(diffLoc, drawables[i].diffuse);
			gl.uniform4fv(specLoc, drawables[i].specular);
			gl.uniform1i(shininessLoc, drawables[i].shininess);
			//gl.uniform4fv(diffLoc, model.materials[0].diffuseReflectance);
			gl.uniformMatrix4fv(normWorldLoc, false, normalMatrixWorld.elements);			
			gl.uniformMatrix4fv(normLoc, false, normalMatrix.elements);
			drawables[i].draw();
		}
		//gl.useProgram(null);
	}
	this.getBounds=function() // Computes Model bounding box
	{		
		var xmin, xmax, ymin, ymax, zmin, zmax;
		var firstvertex = true;
		var nNodes = (model.nodes)?model.nodes.length:1;
		for (var k=0; k<nNodes; k++){
			var m = new Matrix4();
			if (model.nodes)m.elements=new Float32Array(model.nodes[k].modelMatrix);
			//console.log(model.nodes[k].modelMatrix);
			var nMeshes = (model.nodes)?model.nodes[k].meshIndices.length:model.meshes.length;
			for (var n = 0; n < nMeshes; n++){
				var index = (model.nodes)?model.nodes[k].meshIndices[n]:n;
				var mesh = model.meshes[index];
				for(var i=0;i<mesh.vertexPositions.length; i+=3){
					var vertex = m.multiplyVector4(new Vector4([mesh.vertexPositions[i],mesh.vertexPositions[i+1],mesh.vertexPositions[i+2],1])).elements;
					//if (i==0){
					//	console.log([mesh.vertexPositions[i],mesh.vertexPositions[i+1],mesh.vertexPositions[i+2]]);
					//	console.log([vertex[0], vertex[1], vertex[2]]);
					//}
					if (firstvertex){
						xmin = xmax = vertex[0];
						ymin = ymax = vertex[1];
						zmin = zmax = vertex[2];
						firstvertex = false;
					}
					else{
						if (vertex[0] < xmin) xmin = vertex[0];
						else if (vertex[0] > xmax) xmax = vertex[0];
						if (vertex[1] < ymin) ymin = vertex[1];
						else if (vertex[1] > ymax) ymax = vertex[1];
						if (vertex[2] < zmin) zmin = vertex[2];
						else if (vertex[2] > zmax) zmax = vertex[2];
					}
				}
			}
		}
		var dim= {};
		dim.min = [xmin,ymin,zmin];
		dim.max = [xmax,ymax,zmax];
		//console.log(dim);
		return dim;
	}
}
function RenderableWireBoxModel(gl,d){
	var wireModel = new RenderableModel(gl,cubeLineObject);
	var factor = [(d.max[0]-d.min[0])/2,(d.max[1]-d.min[1])/2,(d.max[2]-d.min[2])/2];
	var center = [(d.min[0]+d.max[0])/2,(d.min[1]+d.max[1])/2,(d.min[2]+d.max[2])/2];
	var transformation = new Matrix4().
		translate(center[0], center[1],center[2]).
		scale(factor[0],factor[1],factor[2]);
	this.draw = function(mP,mV,mM){
		wireModel.draw(mP,mV,new Matrix4(mM).multiply(transformation));
	}
}
