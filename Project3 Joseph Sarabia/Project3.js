//Joseph Sarabia
//Practice Assignment 2

			var object = null; 
			var canvas = null;
			var gl = null;
			var messageField = null;
			var model = null;
			var camera = null;
			var projMatrix = null;
			var viewMatrix = [];
			var angle = 0;
			var panangle = 0;
			var spotlight = 0;
			var spotangle = .16;
			var filepath = null;
			var lastdir = 0;
			var exposure = .5;
			var surfacetex = 1;
			var mirrorON = 1
			var diffON = 0;
			window.irrmap = {};
			window.irrmap.data = null;
			
			var file = "model/House/models/";;
			function addMessage(message){
				var st = "-"+message + "\n";
				messageField.value += st;
			}
			  var hdr;
			  var img;
			
			
			
			
			function parseJSON(jsonFile)
			{
				
				var	xhttp = new XMLHttpRequest();
				xhttp.open("GET", jsonFile, false);
				xhttp.overrideMimeType("application/json");
				xhttp.send(null);	
				var Doc = xhttp.responseText;
				
				
				return JSON.parse(Doc);
			}
			
			function init(){
				hdr = new HDRimage();
				img = hdr.readFile("stpeters_probe.hdr", false);
				function setupMenu(){
					var menuItemList = ["Cube","Teapot","Skull"]; 
					var m = document.getElementById("menu");
					var option;
					for (var i=0; i<menuItemList.length;i++){
						option=document.createElement("option");
						option.text = menuItemList[i];
						m.add(option);
					}
					
				}
				function setupMessageArea() {
					messageField = document.getElementById("messageArea");
					document.getElementById("messageClear").setAttribute("onclick","messageField.value='';");
					addMessage("Welcome! Initializing environment");
				}
				//setupMenu();
				setupMessageArea();
				
				canvas = document.getElementById("myCanvas");
				addMessage(((canvas)?"Canvas acquired":"Error: Can not acquire canvas"));

			}
			function setupWebGL() { 
				gl = canvas.getContext("webgl")
					||canvas.getContext("experimental-webgl");
				addMessage("GL Context acquired");
				
				if (!gl.getExtension("OES_texture_float")) { alert("This project requires the OES_texture_float extension. Must use a different hardware."); return; }
				model = new RenderableModel(gl, object, file, img);
				camera = new Camera(gl,model.getBounds(),[0,1,0]);
				
				projMatrix = camera.getProjMatrix();
				viewMatrix = camera.getRotatedViewMatrix(0);
				gl.clearColor(0,0,0,1);
				gl.enable(gl.DEPTH_TEST);
				
			}
			object = parseJSON("house.json");
			

				function toggleSurfaceTexture(){
					if(surfacetex == 1)
						surfacetex = 0;
					else
						surfacetex = 1;
				}
			
				function exposureSlider(value){
					
					exposure = .1 * parseInt(value, 15);
					
				}
			
				function toggleSpotLight(){
					if(spotlight == 1)
						spotlight = 0;
					else
						spotlight = 1;

					draw();
				}
				function angleSlider(value){				
					addMessage(value);
					spotangle = .04 * parseInt(value, 10);
					addMessage(spotangle);
					draw();
				}
			
				function menuHandler(){
					var option = document.getElementById("menu").selectedIndex;
					var ending;
					ending = "model.json";
					if(option == "0")
						file = "model/House/models/";
					if(option == "1")
						file = "model/Shrine/models/";
					if(option == "2")
						file = "model/House_of_parliament/models/";
					if(option == "3")
						file = "model/DijonPalais/models/";
					if(option == "4")
						file = "model/Crytek/models/";
					if(option == "5")
						file = "model/Teapot/models/";
					if(option == "6")
						file = "model/Skull/models/";
					addMessage("opening file " + file);
					object = parseJSON(file+ ending);
					model = new RenderableModel(gl, object, file, img);
					camera = new Camera(gl,model.getBounds(),[0,1,0]);
					projMatrix = camera.getProjMatrix();
					draw();
				}
				
				function menu2Handler(value){
					var option = parseInt(value, 10);
					if(option == 0){
						mirrorON = 1;
						diffON = 0;
					}
					if(option == 1){
						mirrorON = 0;
						diffON = 1;
					}
					if(option == 2){
						mirrorON = 1;
						diffON = 1;
					}
				}
				
				
				function draw(){
					//menuHandler();
					gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
					//viewMatrix = camera.getRotatedViewMatrix(angle);
					viewMatrix = camera.getViewMatrix();
				
					model.draw(spotangle, spotlight, projMatrix, viewMatrix, null);
					//angle++; if (angle > 360) angle -= 360;
					
					window.requestAnimationFrame(draw);
					//anim(draw);

				}

			function mainFunction(){
				//alert("hey");
				init();
				setupWebGL();

				

				

				
				
				
				document.addEventListener('keydown', function(event) {
			   
			    //zoom in with Q
			    if(event.keyCode == 81) {
			    	camera.decFOV();			      
			        projMatrix = camera.getProjMatrix();
			    }
			    
			    //zoom out with E
			    else if(event.keyCode == 69) {			
			    	camera.incFOV();			      
			        projMatrix = camera.getProjMatrix();
			    }			 
			    
			    //Dolly Forwards with W
			    else if(event.keyCode == 87) {

			    	camera.dolly(viewMatrix,camera.getDiag()*.05);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    //Dolly Backwards with S
			    else if(event.keyCode == 83) {
			        
			    	camera.dolly(viewMatrix,camera.getDiag()*-.05);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    
			    //Truck Right with D
			    else if(event.keyCode == 65) {
			        
			    	camera.truck(viewMatrix,camera.getDiag()*.01);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    //Truck Left with A
			    else if(event.keyCode == 68) {
			        
			    	camera.truck(viewMatrix,camera.getDiag()*-.01);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    //Pedestal Up with R
			    else if(event.keyCode == 82) {


			    	camera.pedestal(viewMatrix,camera.getDiag()*-.01);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    //Pedestal Down with F
			    else if(event.keyCode == 70) {
			        
			    	camera.pedestal(viewMatrix,camera.getDiag()*.01);
			    	//projMatrix = camera.getProjMatrix();
			    }
			    //Tilt Up with I
			    else if(event.keyCode == 75) {
			    	//if(lastdir != 0)
			    	//	angle = 1;
			    	
			    	if(angle > -30){
			    		angle--;
			    		camera.tilt(viewMatrix, -2);
			    	//projMatrix = camera.getProjMatrix();
			    	}

					//lastdir = 0;
			    	//if ((angle > 5) && (angle < 355)) angle = 5;
			    	//if (angle > 360) angle = 0;
			    	
			    	//projMatrix = camera.getProjMatrix();

			    }
			    //Tilt Down with K
			    else if(event.keyCode == 73) {		
			    	
		    		//if(lastdir != 1)
		    		//	angle = 360;
		    		//if(angle > -30)
		    		//angle--;

			    	//angle-=1;
			    	//lastdir = 1;
			    	//if ((angle < 355) && (angle > 5)) angle = 355;
			    	//if (angle < 0) angle = 360;
			    	if(angle < 30){
			    		angle++
			    		camera.tilt(viewMatrix, 2);
			    	}

			    }
			    
			    //Pan left with J
			    else if(event.keyCode == 74) {
			    	panangle++; if (panangle > 360) panangle -= 360;
		    		viewMatrix = camera.pan(viewMatrix, 5);
		    		//projMatrix = camera.getProjMatrix();

			    }
			    //Pan Right with L
			    else if(event.keyCode == 76) {
			    	panangle--; if (panangle < 0) panangle += 360;
			    		viewMatrix = camera.pan(viewMatrix, -5);
			    		//projMatrix = camera.getProjMatrix();
			    	
	
			    }
			    //draw();
			    
			});

				//var angle=0;
				
				




				draw();
				return 1;
				
			}
			
			
