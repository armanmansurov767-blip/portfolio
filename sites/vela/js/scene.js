/* Рендерер, студийный свет и камера. Бросает исключение, если WebGL недоступен */
(function (V) {
  if (!V) return;
  const THREE = V.THREE;

  // Фотостудия вместо готовой картинки окружения: тёмный зал и несколько софтбоксов.
  // Именно они дают на алюминии длинные мягкие блики, как на предметной съёмке.
  function studio(renderer) {
    const room = new THREE.Scene();
    room.add(new THREE.Mesh(
      new THREE.SphereGeometry(40, 24, 12),
      new THREE.MeshBasicMaterial({ color: 0x15171b, side: THREE.BackSide }),
    ));
    const softbox = (w, h, color, power, x, y, z) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }),
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      room.add(m);
    };
    // Большие панели светят слабо и ровно, поверх каждой — панель поменьше и ярче:
    // так отражение на металле получается с плавным спадом, а не белым пятном
    softbox(18, 14, 0xffffff, 0.75, 0, 12, -2);       // потолок
    softbox(9, 6, 0xffffff, 1.35, 0, 11.9, -1);
    softbox(16, 10, 0xfff8f2, 0.64, 0, 8, -12);       // стена света сзади: её отражает крышка в общих планах
    softbox(9, 4, 0xfff8f2, 1.15, -2, 6, -11.9);
    softbox(3, 14, 0xffffff, 3.6, -12, 5, 4);         // полоса слева
    softbox(3, 14, 0xe4ecff, 2.4, 12, 6, -2);         // полоса справа, холоднее
    softbox(10, 3, 0xffffff, 0.7, 0, 0.5, 12);        // слабая заливка спереди
    softbox(12, 5, 0xffffff, 0.3, 0, -10, 0);         // отсвет от пола

    const pmrem = new THREE.PMREMGenerator(renderer);
    const map = pmrem.fromScene(room, 0.03).texture;
    pmrem.dispose();
    return map;
  }

  function createScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.environment = studio(renderer);
    scene.environmentIntensity = 1.0;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

    // Основной свет спереди-слева сверху: тени слоёв ложатся назад и вправо
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(-5.6, 11.2, 7.2);
    key.target.position.set(0, 1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 34;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.012;
    key.shadow.radius = 5;
    scene.add(key, key.target);

    // Контровой сзади справа очерчивает кромки, заливка не даёт теням провалиться в чёрное
    const rim = new THREE.DirectionalLight(0xfff6ee, 0.7);
    rim.position.set(5, 3.5, -6);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0b0c0e, 0.22));

    return { renderer, scene, camera };
  }

  V.createScene = createScene;
})(window.Vela);
