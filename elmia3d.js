window.elmia3d = {
  camera : '',
  scene : '',
  renderer : '',
  group : '',
  controls : '',
  targetRotation : 0,
  targetRotationOnMouseDown : 0,
  mouseY : 0,
  mouseYOnMouseDown : 0,
  windowHalfY : window.innerHeight/2,
  extrudeSettings : { amount: 20, bevelEnabled: false, bevelSegments: 0.5, steps: 1, bevelSize: 1, bevelThickness: 1 },
  scaleFactor : 4,
  adjustX : 0,
  adjustY : 0,
  blocks : [],
  arenablock : '',
  arenas : [],
  clients : [],
  clock : '',
  arena : 'D',
  loadprocess : 0,

  options : {},

  init : function(options){
    this.options = options;
    if(this.options.container.indexOf('#') > -1){
      this.options.container = this.options.container.replace('#', '');
      this.options.container = document.getElementById(this.options.container);

    }else{
      this.options.container = this.options.container.replace('.', '');
      this.options.container = document.getElementsByClassName(this.options.container)[0];
    }

    this.setUp3D();
  },

  setUp3D : function(){
    var _this = this;

    this.clock = new THREE.Clock();

    //Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x458EA8 );
    //Create camera
    this.camera = new THREE.PerspectiveCamera( 45, this.options.container.offsetWidth / this.options.container.offsetHeight, 1, 1000 );
    this.camera.position.set( 0, 300, 600 );
    this.scene.add( this.camera );

    //Create renderer
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.options.container.offsetWidth, this.options.container.offsetHeight );

    //Add light
    var light = new THREE.PointLight( 0xffffff, 2 );
    light.castShadow = false;
    this.camera.add( light );

    //Add 3d Group
    this.group = new THREE.Group();
    this.group.rotation.x = Math.PI / 2;
    this.scene.add( this.group );

    //Enamble Controls
    this.controls = new THREE.OrbitControls( this.camera,  this.renderer.domElement );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.6;
    this.controls.update();

    this.options.container.appendChild( this.renderer.domElement );

    this.loadData(function(response, ){
      _this.processArenas(JSON.parse(response).ArrayOfHallCordinates.HallCordinates);
    }, 'data-arenas.json');

    this.loadData(function(response){
      _this.processClients(JSON.parse(response).StandCordinates);
    }, 'data-17130.json');

    this.animate();

  },

  changeArena : function(arena){
    this.group.remove(this.options.arenablock);

    while(this.blocks.length > 0){
      this.group.remove( this.blocks[0].obj );
      this.blocks.splice(0, 1);
    }
    this.render();

    this.options.arena = arena;
    this.drawArena();
    this.drawClients();
  },

  fireEvent : function(){
    new TWEEN.Tween( this.blocks[630670].position ).to( { z: -40 }, 500 ).easing(
 TWEEN.Easing.Cubic.Out ).start();
    new TWEEN.Tween( this.blocks[630670].scale ).to( { z: 2 }, 500 ).easing(
 TWEEN.Easing.Cubic.Out ).start();
  },

  loadData : function(callback ,src){

    var xobj = new XMLHttpRequest();
     xobj.overrideMimeType("application/json");
     xobj.open('GET', src, true);
     xobj.onreadystatechange = function() {
         if (xobj.readyState == 4 && xobj.status == "200") {
             callback(xobj.responseText);
         }
     };
     xobj.send(null);
  },

  processClients : function(data){
    for(var i = 0; i < data.length; i++) {
      var obj = data[i];
      if(!this.clients[obj.HallName]) this.clients[obj.HallName] = [];
      this.clients[obj.HallName].push(obj);
    }

    this.addToQue();
  },

  processArenas : function(data){
    for(var i = 0; i < data.length; i++) {
      this.arenas[data[i].HallName] = [];
      this.arenas[data[i].HallName]['p'] = data[i].Points['d3p1:string'];
      this.arenas[data[i].HallName]['c'] = data[i].Center.split(', ');
      ;
    }

    this.addToQue();
  },

  addToQue : function(){
    this.loadprocess++;

    if(this.loadprocess == 2){
      this.drawArena();
      this.drawClients();
    }
  },

  drawArena : function(data){
    var shape = new THREE.Shape(),
    points = this.arenas[this.options.arena]['p'],
    startVal = points[points.length - 1].split(', ');

    this.adjustX = this.arenas[this.options.arena]['c'][0] * this.scaleFactor,
    this.adjustY = this.arenas[this.options.arena]['c'][1] * this.scaleFactor;

    shape.moveTo((parseInt(startVal[0]) * this.scaleFactor)-this.adjustX , (parseInt(startVal[1]) * this.scaleFactor)-this.adjustY);

    for(var j = 0; j < points.length; j++){
      var pointVal = points[j].split(', ');
      shape.lineTo( (parseInt(pointVal[0]) * this.scaleFactor) - this.adjustX, (parseInt(pointVal[1]) * this.scaleFactor) - this.adjustY );
    }

    var geometry = new THREE.ExtrudeGeometry( shape, { amount: 5, bevelEnabled: false, bevelSegments: 0, steps: 1, bevelSize: 1, bevelThickness: 1 } ),
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

    this.options.arenablock = arena;

    this.group.add(arena);
  },

  drawClients : function(){
    for(var i = 0; i < this.clients[this.options.arena].length; i++) {
        var obj = this.clients[this.options.arena][i],
        shape = new THREE.Shape(),
        points = obj.Points.string;

        startVal = points[points.length - 1].split(', ');

        shape.moveTo((parseInt(startVal[0]) * this.scaleFactor) - this.adjustX , (parseInt(startVal[1]) * this.scaleFactor) - this.adjustY );

        for(var j = 0; j < points.length; j++){
          var pointVal = points[j].split(', ');
          shape.lineTo( (parseInt(pointVal[0]) * this.scaleFactor) - this.adjustX , (parseInt(pointVal[1]) * this.scaleFactor) - this.adjustY );
        }

        this.addShape( shape, obj.BlockId);

    }
    this.render();
  },

  addShape : function(shape, _id){
    var geometry = new THREE.ExtrudeGeometry( shape, this.extrudeSettings ),
    material = new THREE.MeshDepthMaterial( {
      transparent: true,
      opacity: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    } ),
    mesh = new THREE.Mesh( geometry,  material );
    mesh.position.set( 0, 0, -20 );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = _id;
    this.blocks.push({
      'id' : _id,
      'obj' : mesh
    });
    this.group.add( mesh );

    var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
    var mat = new THREE.LineBasicMaterial( { color: 0x0C2333, linewidth: 2 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    mesh.add( wireframe );
  },

  animate : function(){
    var _this = this;
    var t = this.clock.getElapsedTime();
    requestAnimationFrame( function(){
      _this.animate();
    } );

    TWEEN.update();
    // required if controls.enableDamping or controls.autoRotate are set to true
    this.controls.update();

    this.render();
  },

 render : function() {
    //group.rotation.x += ( targetRotation - group.rotation.x ) * 0.05;
    this.renderer.render( this.scene, this.camera );
  }
}
