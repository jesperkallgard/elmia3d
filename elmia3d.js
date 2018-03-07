/*jshint esversion: 6 */

const elmia3d = (function() {
  let camera,
  scene,
  renderer,
  group,
  controls,
  adjustX,
  adjustY,
  blocks = [],
  loadprocess = 0,
  loadedArenas = [],
  loadedClients = [],
  arenablocks = [],
  options = {},
  animatedblocks = [],
  lastMove = Date.now(),
  running = true;

  const scaleFactor = 1,
  standbyAfter = 5000,
  hallSetup = {
    'all' : {
      bevelAmount : 10,
      camera : {
        x : -50,
        y : 200,
        z : 400
      },
      centerAdjust : 30
    },
    'A' : {
      bevelAmount : 10,
      camera : {
        x : 0,
        y : 105,
        z : 170
      },
      centerAdjust : 0
    },
    'B' : {
      bevelAmount : 10,
      camera : {
        x : 166,
        y : 173,
        z : 0
      },
      centerAdjust : 0
    },
    'C' : {
      bevelAmount : 10,
      camera : {
        x : -50,
        y : 100,
        z : -110
      },
      centerAdjust : 0
    },
    'D' : {
      bevelAmount : 10,
      camera : {
        x : -130,
        y : 112,
        z : 0
      },
      centerAdjust : 0
    },
    'E' : {
      bevelAmount : 10
    }
  }

  const init = function(userOptions){
    options = userOptions;
    if(options.container.indexOf("#") > -1){
      options.container = options.container.replace("#", "");
      options.container = document.getElementById(options.container);

    }else{
      options.container = options.container.replace(".", "");
      options.container = document.getElementsByClassName(options.container)[0];
    }

    window.addEventListener("mousedown", requestRender, false);
    window.addEventListener("mouseup", function(){running = false}, false);

    setUp3D();
  };

  const setUp3D = function(){
    //Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x458EA8 );
  

    camera = new THREE.PerspectiveCamera( 45, options.container.offsetWidth / options.container.offsetHeight, 1, 1000 );
    scene.add( camera );

    //Create renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( options.container.offsetWidth, options.container.offsetHeight );

    //Add light
    const light = new THREE.PointLight( 0xffffff, 2 );
    light.castShadow = false;
    camera.add( light );

    //Add 3d Group
    group = new THREE.Group();
    group.rotation.x = Math.PI / 2;
    scene.add( group );

    //Enamble Controls
    controls = new THREE.OrbitControls( camera,  renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.6;
    controls.update();

    options.container.appendChild( renderer.domElement );

    loadData(function(response){
      processArenas(JSON.parse(response).ArrayOfHallCordinates.HallCordinates);
    }, "data-arenas.json");

    loadData(function(response){
      processClients(JSON.parse(response).StandCordinates);
    }, "data-17130.json");

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    animate();

  };

  const loadData = function(callback ,src){
    const xobj = new XMLHttpRequest();
     xobj.overrideMimeType("application/json");
     xobj.open("GET", src, true);
     xobj.onreadystatechange = function() {
         if (xobj.readyState == 4 && xobj.status == "200") {
             callback(xobj.responseText);
         }
     };
     xobj.send(null);
  };


  const processClients = function(data){

    for (let obj of data) {
      if(!loadedClients[obj.HallName]) loadedClients[obj.HallName] = [];
      loadedClients[obj.HallName].push(obj);
    }

    queAndRender();
  };

  const processArenas = function(data){
    for (let obj of data) {
      if(obj.HallName === 'A' || obj.HallName === 'B' || obj.HallName === 'C' || obj.HallName === 'D' || obj.HallName === 'LN'){
        loadedArenas[obj.HallName] = [];
        loadedArenas[obj.HallName].p = obj.Points["d3p1:string"];
        loadedArenas[obj.HallName].c = obj.Center.split(", ");
      }
    }

    queAndRender();
  };

  const queAndRender = function(){
    if(loadprocess){
      
      if(options.arena == 'all'){
        for(let hall in loadedArenas){
          drawArena(hall);
          drawClients(hall);
        }
      }else{
        drawArena(options.arena);
        drawClients(options.arena);
      }
      centerObject();
      requestRender();
    }else{
      loadprocess++;
    }
  };

  const drawArena = function(hall){
    const shape = new THREE.Shape();
    const points = loadedArenas[hall].p,
    startVal = points[points.length - 1].split(", ");

    shape.moveTo((parseInt(startVal[0])) , (parseInt(startVal[1])));

    for(let point of points){
      var pointVal = point.split(", ");
      shape.lineTo( (parseInt(pointVal[0])), (parseInt(pointVal[1])) );
    }

    const geometry = new THREE.ExtrudeGeometry( shape, { amount: 5, bevelEnabled: false, bevelSegments: 0, steps: 1, bevelSize: 1, bevelThickness: 1 } ),
    material = new THREE.MeshPhongMaterial( {
      color: 0x05202E,
      transparent: true,
      opacity: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    } ),
    arena = new THREE.Mesh( geometry,  material );
    arena.position.set( 0, 0, 0 );
    arena.rotation.set( 0, 0, 0 );
    arena.castShadow = false;
    arena.receiveShadow = false;

    arenablocks.push(arena);

    group.add(arena);

  };

  const drawClients = function(hall){
    if(!loadedClients[hall]) return false;

    for(let obj of loadedClients[hall]){
        const shape = new THREE.Shape();
        const points = obj.Points.string;
        const startVal = points[points.length - 1].split(", ");

        shape.moveTo((parseInt(startVal[0])) , (parseInt(startVal[1])) );

        for(let point of points){
          var pointVal = point.split(", ");
          shape.lineTo( (parseInt(pointVal[0])) , (parseInt(pointVal[1])) );
        }

        addExhibitor( shape, obj.BlockId);
    }
    
  };

  const addExhibitor = function(shape, _id){
    const geometry = new THREE.ExtrudeGeometry( shape, { amount: hallSetup[options.arena].bevelAmount, bevelEnabled: false, bevelSegments: 0.5, steps: 1, bevelSize: 1, bevelThickness: 1 } );
    const material = new THREE.LineBasicMaterial( {
    	color: 0xffffff,
    	linewidth: 1,
    	linecap: 'round', //ignored by WebGLRenderer
    	linejoin:  'round' //ignored by WebGLRenderer
    } );

    const mesh = new THREE.Mesh( geometry,  material );

    mesh.position.set( 0, 0, -hallSetup[options.arena].bevelAmount );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = _id;

    blocks.push({
      "id" : _id,
      "obj" : mesh
    });
    group.add( mesh );

    mesh.add( new THREE.LineSegments( new THREE.EdgesGeometry( mesh.geometry ), new THREE.LineBasicMaterial( { color: 0x0C2333, linewidth: 1 } )));
  };

  const centerObject = function(){
    var box = new THREE.Box3().setFromObject( group ).getCenter( group.position ).multiplyScalar( - 1 );
    camera.position.set( hallSetup[options.arena].camera.x, hallSetup[options.arena].camera.y, hallSetup[options.arena].camera.z );
    group.position.x -= hallSetup[options.arena].centerAdjust;
  }

  const drawArrows = function(){
    const shape = new THREE.Shape();
    const points = [
      [-1, 1],
      [0, 0],
      [1, 1],
      [.5, 1],
      [.5, 2],
      [-.5, 2],
      [-.5, 1]
    ];

    let count = 0;
    const localScale = 6;

    for(let point of points){
      let x = (point[0] * localScale) * scaleFactor;
      let y = (point[1] * localScale) * scaleFactor;

      x += (0 * scaleFactor);
      y += (55 * scaleFactor);

      if(count == 0) shape.moveTo( x, y );
      else shape.lineTo( x, y  );
      count++;
    }

    const geometry = new THREE.ExtrudeGeometry( shape, { amount: 5, bevelEnabled: false, bevelSegments: 0.5, steps: 1, bevelSize: 1, bevelThickness: 1 } );
    const material = new THREE.LineBasicMaterial( {
    	color: 0xffffff,
    	linewidth: 1,
    	linecap: 'round', //ignored by WebGLRenderer
    	linejoin:  'round' //ignored by WebGLRenderer
    } );

    const mesh = new THREE.Mesh( geometry,  material );

    group.add(mesh);
  };

  const getBlockById = function(_id){
    let block;
    for (let obj of blocks){
      if(obj.id == _id){
        block = obj;
        break;
      }
    }

    return block;
  }

  const requestRender = function() {
    lastMove = Date.now();
    if ( !running) {
      running = true;
      requestAnimationFrame(animate);
    }
  }

  const animate = function(){
    TWEEN.update();
    renderer.render( scene, camera );
    controls.update();

    if (lastMove + standbyAfter < Date.now() || !running) {
      running = false;
    } else {
      running = true;
      requestAnimationFrame( function(){
        animate();
      } );
    }
  };

  const changeArena = function(showhall){

    while(group.children.length > 0){
      group.remove(group.children[0]);
    }
  
    group.position.x = 0;
    group.position.z = 0;

    options.arena = showhall;
    queAndRender();
  };

  const showBlocksById = function(arr, color){
    requestRender();

    for(let reverseBlock of animatedblocks){
        if(arr.indexOf(reverseBlock.id) < 0){
          animateBlock(reverseBlock, {r : 1, g : 1, b : 1}, -20, 1);
        }
    }

    animatedblocks = [];

    for(let _id of arr){
      let block = getBlockById(_id);

      if(block){  
        animateBlock(block, color, -40, 2);
        animatedblocks.push(block);
      }
    }
  };

  const animateBlock = function(block, color, position, scale, time = 500){
    const delay = Math.random()*1000;

    new TWEEN.Tween(
      {
        r: block.obj.material.color.r,
        g: block.obj.material.color.g,
        b: block.obj.material.color.b
      }
    )
    .to(
      {
        r : color.r,
        g : color.g,
        b : color.b
      },
      time)
    .onUpdate(function(){
      block.obj.material.color.r = this.r;
      block.obj.material.color.g = this.g;
      block.obj.material.color.b = this.b;
    })
    .delay(delay)
    .start();

    new TWEEN.Tween( block.obj.position ).to( { z: position }, time ).easing(
        TWEEN.Easing.Cubic.Out ).delay(delay).start();
    new TWEEN.Tween( block.obj.scale ).to( { z: scale }, time ).easing(
        TWEEN.Easing.Cubic.Out ).delay(delay).start();
  }

  return {
    init : init,
    showBlocksById : showBlocksById,
    changeArena : changeArena
  };
})();
