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
  arenablock,
  options = {};

  const scaleFactor = 4;


  const init = function(userOptions){
    options = userOptions;
    if(options.container.indexOf("#") > -1){
      options.container = options.container.replace("#", "");
      options.container = document.getElementById(options.container);

    }else{
      options.container = options.container.replace(".", "");
      options.container = document.getElementsByClassName(options.container)[0];
    }

    setUp3D();
  };

  const setUp3D = function(){
    //Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x458EA8 );
    //Create camera
    camera = new THREE.PerspectiveCamera( 45, options.container.offsetWidth / options.container.offsetHeight, 1, 1000 );
    camera.position.set( 0, 300, 600 );
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

    addToQue();
  };

  const processArenas = function(data){
    for (let obj of data) {
      loadedArenas[obj.HallName] = [];
      loadedArenas[obj.HallName].p = obj.Points["d3p1:string"];
      loadedArenas[obj.HallName].c = obj.Center.split(", ");
    }

    addToQue();
  };

  const addToQue = function(){
    loadprocess++;

    if(loadprocess == 2){
      drawArena();
      drawClients();
    }
  };

  const drawArena = function(data){
    const shape = new THREE.Shape(),
    points = loadedArenas[options.arena].p,
    startVal = points[points.length - 1].split(", ");

    adjustX = (loadedArenas[options.arena].c[0] * scaleFactor);
    adjustY = (loadedArenas[options.arena].c[1] * scaleFactor);

    shape.moveTo((parseInt(startVal[0]) * scaleFactor)-adjustX , (parseInt(startVal[1]) * scaleFactor)-adjustY);

    for(let point of points){
      var pointVal = point.split(", ");
      shape.lineTo( (parseInt(pointVal[0]) * scaleFactor) - adjustX, (parseInt(pointVal[1]) * scaleFactor) - adjustY );
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

    arenablock = arena;

    group.add(arena);
  };

  const drawClients = function(){
    for(let obj of loadedClients[options.arena]){
        const shape = new THREE.Shape();
        const points = obj.Points.string;
        const startVal = points[points.length - 1].split(", ");

        shape.moveTo((parseInt(startVal[0]) * scaleFactor) - adjustX , (parseInt(startVal[1]) * scaleFactor) - adjustY );

        for(let point of points){
          var pointVal = point.split(", ");
          shape.lineTo( (parseInt(pointVal[0]) * scaleFactor) - adjustX , (parseInt(pointVal[1]) * scaleFactor) - adjustY );
        }

        addShape( shape, obj.BlockId);

    }
    render();
  };

  const addShape = function(shape, _id){
    const geometry = new THREE.ExtrudeGeometry( shape, { amount: 20, bevelEnabled: false, bevelSegments: 0.5, steps: 1, bevelSize: 1, bevelThickness: 1 } );
    const material = new THREE.MeshDepthMaterial( {
      transparent: true,
      opacity: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    } );
    const mesh = new THREE.Mesh( geometry,  material );

    mesh.position.set( 0, 0, -20 );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = _id;

    blocks.push({
      "id" : _id,
      "obj" : mesh
    });
    group.add( mesh );

    mesh.add( new THREE.LineSegments( new THREE.EdgesGeometry( mesh.geometry ), new THREE.LineBasicMaterial( { color: 0x0C2333, linewidth: 2 } )));
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

  const animate = function(){
    requestAnimationFrame( function(){
      animate();
    } );

    TWEEN.update();
    controls.update();

    render();
  };

  const render = function() {
    renderer.render( scene, camera );
  };

  const changeArena = function(arena){
    group.remove(arenablock);

    while(blocks.length > 0){
      group.remove( blocks[0].obj );
      blocks.splice(0, 1);
    }
    render();

    options.arena = arena;
    drawArena();
    drawClients();
  };

  const showBlocksById = function(arr){
    for(let _id of arr){
      let block = getBlockById(_id);

      if(block){
        new TWEEN.Tween( block.obj.position ).to( { z: -40 }, 500 ).easing(
     TWEEN.Easing.Cubic.Out ).start();
        new TWEEN.Tween( block.obj.scale ).to( { z: 2 }, 500 ).easing(
     TWEEN.Easing.Cubic.Out ).start();
      }
    }
  };

  return {
    init : init,
    showBlocksById : showBlocksById
  };
})();
