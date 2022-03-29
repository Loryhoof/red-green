import * as THREE from 'three';

import metaversefile from 'metaversefile';

const { useApp, useFrame, useInternals, useLocalPlayer, useLoaders, usePhysics, useCleanup, useActivate, useNpcManager } = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();


export default () => {
  const app = useApp();
  const { renderer, camera } = useInternals();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  const textureLoader = new THREE.TextureLoader();
  const npcManager = useNpcManager();
  
  //####################################################### load bridge glb ####################################################
  {    
    let velocity = new THREE.Vector3();
    let angularVel = new THREE.Vector3();
    let physicsIds = [];
    let defaultSpawn = new THREE.Vector3(-162, -9, 1.78);
    let headObj = null;
    let signalObj = null;
    let degrees = 180;
    let timeSincePassive = 0;
    let timeSinceActive = 0;
    let hide = true;
    let goalX = 70;
    let minWait = 3500;
    let maxWait = 10000;
    let rotationSpeed = 2;
    let goColor = 0x2eb800;
    let stopColor = 0xc90000;


    /*(async () => {
        const u = `${baseUrl}/assets/stange.glb`; // must prefix "/bride-game" when working locally
        let gltf = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
            
        });
        app.add(gltf.scene);
        app.updateMatrixWorld();
    })();*/
    (async () => {
        const u = `${baseUrl}/bridge-game/assets/wassiefirst.glb`; // must prefix "/bride-game" when working locally
        let gltf = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);        
        });
        app.add(gltf.scene);

        app.traverse(o => {
                  if(o.name === "head") {
                    headObj = o;
                  }
                  if(o.name === "signal") {
                    signalObj = o;
                  }
                  o.castShadow = true;
                });

        const physicsId = physics.addGeometry(gltf.scene);
        physicsIds.push(physicsId);
        app.updateMatrixWorld();
    })();
    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
    });

    const _checkCharacterIsMoving = (timestamp) => {
      if(localPlayer.characterPhysics.velocity.length().toFixed(2) > 1 && localPlayer.position.x < goalX) {
        timeSincePassive = timestamp;
        hide = true;
        signalObj.material.emissive = new THREE.Color(goColor);
        physics.setCharacterControllerPosition(localPlayer.characterController, defaultSpawn);
      }

      for (var i = 0; i < npcManager.npcs.length; i++) {
        if(npcManager.npcs[i].characterPhysics.velocity.length().toFixed(2) > 1 && npcManager.npcs[i].position.x < goalX) {
          //physics.setCharacterControllerPosition(npcManager.npcs[i].characterController, defaultSpawn);
          let npcPlayer = npcManager.npcs[i];
           if (!npcPlayer.hasAction('stop')) {
              const newAction = {
                type: 'stop'
              };
              npcPlayer.addAction(newAction);
              
              setTimeout(() => {
                npcPlayer.removeAction('stop');
              }, 1000);
            }

        }
      }
    }


    useFrame(({ timeDiff, timestamp }) => {

      if(localPlayer.avatar) {

        if (localPlayer.hasAction('narutoRun') ){
            localPlayer.removeAction('narutoRun');
            // this doesn't affect speed unfortunately, we need ways to completely disable actions in some scenes.       
        }

        if (localPlayer.hasAction('fly') ){
            localPlayer.removeAction('fly');
            // works but has stutter when pressed       
        }

                
        if(headObj && signalObj) {
          degrees = THREE.MathUtils.clamp(degrees, 0, 180);

          if(degrees === 0) {
            if((timestamp - timeSinceActive) > 5000) {
              timeSincePassive = timestamp;
              hide = true;
              signalObj.material.emissive = new THREE.Color(goColor);

              for (var i = 0; i < npcManager.npcs.length; i++) {
                let npcPlayer = npcManager.npcs[i];
                 if (!npcPlayer.hasAction('go')) {
                    const newAction = {
                      type: 'go'
                    };
                    npcPlayer.addAction(newAction);
                    
                    setTimeout(() => {
                      npcPlayer.removeAction('go');
                    }, 1000);
                  }

              }
            }
            _checkCharacterIsMoving(timestamp);
          }

          //console.log(localPlayer.characterPhysics.velocity.length());



          if(degrees === 180) {
            if((timestamp - timeSincePassive) > Math.floor(Math.random() * maxWait) + minWait) {
              timeSinceActive = timestamp;
              hide = false;
              signalObj.material.emissive = new THREE.Color(stopColor);
            }
          }

          if(hide) {
            degrees+=rotationSpeed;
          }
          else {
            degrees-=rotationSpeed;
          }

          headObj.rotation.y = THREE.MathUtils.degToRad(degrees);
          headObj.updateMatrixWorld();
        }
        
      }

      // Resets character position to spawn position
      if(localPlayer.position.y < -25 || localPlayer.characterPhysics.velocity.length() > 25) {
        //physics.setCharacterControllerPosition(localPlayer.characterController, defaultSpawn);
      }

      
    });
  }

  return app;
};

