import * as THREE from 'three';

// --------------------------------------------------
// 0. UI（所持金・インベントリ・メッセージ）の作成
// --------------------------------------------------
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.top = '15px';
uiContainer.style.left = '15px';
uiContainer.style.color = '#fff';
uiContainer.style.fontFamily = 'sans-serif';
uiContainer.style.fontSize = '16px';
uiContainer.style.fontWeight = 'bold';
uiContainer.style.textShadow = '2px 2px 4px #000';
uiContainer.style.pointerEvents = 'none';
uiContainer.style.zIndex = '10';
uiContainer.innerHTML = `
  <div style="background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 8px;">
    <div id="gold-ui">💰 所持金: 0 G</div>
    <div id="inventory-ui" style="margin-top: 5px;">🌽 トウモロコシ: 0 個</div>
  </div>
  <div id="message-ui" style="margin-top: 10px; color: #f1c40f; min-height: 24px;"></div>
`;
document.body.appendChild(uiContainer);

let playerGold = 0;
let inventory = { crop: 0 };

function updateUI() {
  document.getElementById('gold-ui').innerText = `💰 所持金: ${playerGold} G`;
  document.getElementById('inventory-ui').innerText = `🌽 トウモロコシ: ${inventory.crop} 個`;
}

function showMessage(msg) {
  const msgEl = document.getElementById('message-ui');
  msgEl.innerText = msg;
  setTimeout(() => {
    if (msgEl.innerText === msg) msgEl.innerText = '';
  }, 3000);
}

// --------------------------------------------------
// 0-B. 画面どこでも可変＆追従ジョイスティック
// --------------------------------------------------
const joystickBase = document.createElement('div');
joystickBase.style.position = 'absolute';
joystickBase.style.width = '80px';
joystickBase.style.height = '80px';
joystickBase.style.background = 'rgba(255, 255, 255, 0.25)';
joystickBase.style.border = '2px solid rgba(255, 255, 255, 0.6)';
joystickBase.style.borderRadius = '50%';
joystickBase.style.pointerEvents = 'none';
joystickBase.style.display = 'none';
joystickBase.style.zIndex = '10';

const joystickStick = document.createElement('div');
joystickStick.style.position = 'absolute';
joystickStick.style.top = '20px';
joystickStick.style.left = '20px';
joystickStick.style.width = '40px';
joystickStick.style.height = '40px';
joystickStick.style.background = 'rgba(255, 255, 255, 0.8)';
joystickStick.style.borderRadius = '50%';
joystickStick.style.pointerEvents = 'none';

joystickBase.appendChild(joystickStick);
document.body.appendChild(joystickBase);

const actionBtn = document.createElement('div');
actionBtn.innerText = '決定';
actionBtn.style.position = 'absolute';
actionBtn.style.bottom = '35px';
actionBtn.style.right = '30px';
actionBtn.style.width = '75px';
actionBtn.style.height = '75px';
actionBtn.style.background = '#e74c3c';
actionBtn.style.color = '#fff';
actionBtn.style.fontSize = '18px';
actionBtn.style.fontWeight = 'bold';
actionBtn.style.borderRadius = '50%';
actionBtn.style.display = 'flex';
actionBtn.style.alignItems = 'center';
actionBtn.style.justifyContent = 'center';
actionBtn.style.border = '3px solid #ffffff';
actionBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';
actionBtn.style.userSelect = 'none';
actionBtn.style.touchAction = 'none';
actionBtn.style.zIndex = '10';
actionBtn.style.cursor = 'pointer';
document.body.appendChild(actionBtn);

let joystickVector = { x: 0, z: 0 };
let isTouchingJoystick = false;
let joystickOrigin = { x: 0, y: 0 };
let activePointerId = null; // 操作中のポインターID
const maxRadius = 30;

// タッチ開始
window.addEventListener('pointerdown', (e) => {
  if (e.target === actionBtn) return;

  if (e.clientX < window.innerWidth * 0.75 || e.clientY < window.innerHeight * 0.75) {
    isTouchingJoystick = true;
    activePointerId = e.pointerId;
    joystickOrigin.x = e.clientX;
    joystickOrigin.y = e.clientY;

    joystickBase.style.left = `${e.clientX - 40}px`;
    joystickBase.style.top = `${e.clientY - 40}px`;
    joystickStick.style.transform = 'translate(0px, 0px)';
    joystickBase.style.display = 'block';

    // 指の固定追跡（画面外に移動しても離した扱いにさせない）
    if (e.target && e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }
});

// タッチ移動（可動範囲を超えたら土台ごと指に引っ張られてついてくる追従処理）
window.addEventListener('pointermove', (e) => {
  if (!isTouchingJoystick || (activePointerId !== null && e.pointerId !== activePointerId)) return;

  let deltaX = e.clientX - joystickOrigin.x;
  let deltaY = e.clientY - joystickOrigin.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > maxRadius) {
    const angle = Math.atan2(deltaY, deltaX);
    // 指が離れすぎた場合、土台の位置を指の方向に引っ張ってずらす（追従）
    joystickOrigin.x = e.clientX - Math.cos(angle) * maxRadius;
    joystickOrigin.y = e.clientY - Math.sin(angle) * maxRadius;

    joystickBase.style.left = `${joystickOrigin.x - 40}px`;
    joystickBase.style.top = `${joystickOrigin.y - 40}px`;

    deltaX = Math.cos(angle) * maxRadius;
    deltaY = Math.sin(angle) * maxRadius;
  }

  joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

  joystickVector.x = deltaX / maxRadius;
  joystickVector.z = deltaY / maxRadius;
});

// タッチ終了
function resetJoystick(e) {
  if (e && activePointerId !== null && e.pointerId !== activePointerId) return;

  isTouchingJoystick = false;
  activePointerId = null;
  joystickBase.style.display = 'none';
  joystickVector.x = 0;
  joystickVector.z = 0;
}

window.addEventListener('pointerup', resetJoystick);
window.addEventListener('pointercancel', resetJoystick);

actionBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleAction();
});

// --------------------------------------------------
// 1. シーン・カメラ・レンダラーの設定
// --------------------------------------------------
const scene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 10;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);

camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// --------------------------------------------------
// 2. 畑（4x4 グリッド）の構築
// --------------------------------------------------
const TILE_SIZE = 1.5;
const GRID_SIZE = 4;
const tiles = [];

const STATE_COLORS = {
  EMPTY: 0x4baa3b,
  TILLED: 0x8b5a2b,
  SEEDED: 0xa67c52,
  WATERED: 0x4a2e16,
  READY: 0x4a2e16
};

const tileGroup = new THREE.Group();

for (let x = 0; x < GRID_SIZE; x++) {
  for (let z = 0; z < GRID_SIZE; z++) {
    const geometry = new THREE.PlaneGeometry(TILE_SIZE - 0.1, TILE_SIZE - 0.1);
    const material = new THREE.MeshStandardMaterial({ color: STATE_COLORS.EMPTY });
    const mesh = new THREE.Mesh(geometry, material);

    const posX = (x - (GRID_SIZE - 1) / 2) * TILE_SIZE;
    const posZ = (z - (GRID_SIZE - 1) / 2) * TILE_SIZE;

    mesh.position.set(posX, 0, posZ);
    mesh.rotation.x = -Math.PI / 2;
    tileGroup.add(mesh);

    const cropGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const cropMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
    const cropMesh = new THREE.Mesh(cropGeo, cropMat);
    cropMesh.position.set(posX, 0.3, posZ);
    cropMesh.visible = false;
    scene.add(cropMesh);

    tiles.push({
      gridX: x,
      gridZ: z,
      mesh: mesh,
      cropMesh: cropMesh,
      state: 0,
      x: posX,
      z: posZ
    });
  }
}
scene.add(tileGroup);

// --------------------------------------------------
// 3. 出荷箱の作成
// --------------------------------------------------
const binGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
const binMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
const shippingBin = new THREE.Mesh(binGeo, binMat);
shippingBin.position.set(4.5, 0.4, 0);
scene.add(shippingBin);

// --------------------------------------------------
// 4. カーソル・プレイヤーの作成
// --------------------------------------------------
const cursorGeo = new THREE.RingGeometry(TILE_SIZE * 0.4, TILE_SIZE * 0.48, 4);
const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const cursor = new THREE.Mesh(cursorGeo, cursorMat);
cursor.rotation.x = -Math.PI / 2;
cursor.position.y = 0.02;
scene.add(cursor);

const playerGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.6, 3);
scene.add(player);

// --------------------------------------------------
// 5. 操作と判定ロジック
// --------------------------------------------------
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.code === 'Space') handleAction();
});
window.addEventListener('keyup', (e) => (keys[e.key] = false));

const moveSpeed = 0.07;
let selectedTile = null;
let isNearBin = false;

function updatePlayer() {
  let moveX = 0;
  let moveZ = 0;

  if (keys['ArrowUp'] || keys['w'] || keys['W']) moveZ -= 1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) moveZ += 1;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) moveX -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += 1;

  if (joystickVector.x !== 0 || joystickVector.z !== 0) {
    moveX = joystickVector.x;
    moveZ = joystickVector.z;
  }

  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const currentSpeed = isTouchingJoystick ? moveSpeed * Math.min(length, 1.0) : moveSpeed;

    const dirX = moveX / length;
    const dirZ = moveZ / length;

    player.position.x += dirX * currentSpeed;
    player.position.z += dirZ * currentSpeed;

    player.rotation.y = Math.atan2(dirX, dirZ);
  }

  checkTargetObject();
}

function checkTargetObject() {
  const distToBin = player.position.distanceTo(shippingBin.position);
  if (distToBin < 1.8) {
    isNearBin = true;
    selectedTile = null;
    cursor.position.x = shippingBin.position.x;
    cursor.position.z = shippingBin.position.z;
    cursorMat.color.setHex(0x9b59b6);
    cursor.visible = true;
    return;
  }

  isNearBin = false;
  cursorMat.color.setHex(0xffff00);

  let minDistance = Infinity;
  let closestTile = null;

  tiles.forEach((tile) => {
    const dx = player.position.x - tile.x;
    const dz = player.position.z - tile.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < minDistance) {
      minDistance = dist;
      closestTile = tile;
    }
  });

  if (minDistance < 2.0) {
    selectedTile = closestTile;
    cursor.position.x = selectedTile.x;
    cursor.position.z = selectedTile.z;
    cursor.visible = true;
  } else {
    selectedTile = null;
    cursor.visible = false;
  }
}

function handleAction() {
  if (isNearBin) {
    if (inventory.crop > 0) {
      const earnedGold = inventory.crop * 100;
      playerGold += earnedGold;
      showMessage(`トウモロコシを ${inventory.crop} 個出荷し、${earnedGold} G 獲得しました！`);
      inventory.crop = 0;
      updateUI();
    } else {
      showMessage('出荷できる作物がありません。');
    }
    return;
  }

  if (!selectedTile) return;

  switch (selectedTile.state) {
    case 0:
      selectedTile.state = 1;
      selectedTile.mesh.material.color.setHex(STATE_COLORS.TILLED);
      break;

    case 1:
      selectedTile.state = 2;
      selectedTile.mesh.material.color.setHex(STATE_COLORS.SEEDED);
      break;

    case 2:
      selectedTile.state = 3;
      selectedTile.mesh.material.color.setHex(STATE_COLORS.WATERED);

      const targetTile = selectedTile;
      setTimeout(() => {
        if (targetTile.state === 3) {
          targetTile.state = 4;
          targetTile.cropMesh.visible = true;
        }
      }, 1500);
      break;

    case 4:
      selectedTile.state = 0;
      selectedTile.mesh.material.color.setHex(STATE_COLORS.EMPTY);
      selectedTile.cropMesh.visible = false;

      inventory.crop += 1;
      updateUI();
      showMessage('トウモロコシを 1 個収穫しました！');
      break;
  }
}

// --------------------------------------------------
// 6. ループとリサイズ
// --------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  updatePlayer();

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 10;

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = (frustumSize * aspect) / -2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();