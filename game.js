class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    this.load.image("road", "assets/background.png");
    this.load.image("bike", "assets/bike.png");
    this.load.image("hurdle", "assets/hurdle.png");
  }

  create() {
    const { width, height } = this.scale;
    this.speed = 4;
    this.isGameOver = false;

    /* ===== BACKGROUND (NO TILESPRITE) ===== */
    this.bg1 = this.add.image(width / 2, height / 2, "road")
      .setDisplaySize(width, height);

    this.bg2 = this.add.image(width / 2, -height / 2, "road")
      .setDisplaySize(width, height);

    /* ===== BIKE ===== */
    this.bike = this.physics.add.sprite(width / 2, height * 0.78, "bike");
    this.bike.setScale(0.45);
    this.bike.setDepth(10);
    this.bike.setCollideWorldBounds(true);

    /* Remove white feel by blending */
    this.bike.setAlpha(0.98);

    /* ===== CONTROLS ===== */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.moveLeft = false;
    this.moveRight = false;

    /* ===== BUTTONS ===== */
    this.createButtons();

    /* ===== HURDLES ===== */
    this.hurdles = this.physics.add.group();

    this.physics.add.overlap(
      this.bike,
      this.hurdles,
      this.gameOver,
      null,
      this
    );

    this.time.addEvent({
      delay: 1600,
      callback: this.spawnHurdle,
      callbackScope: this,
      loop: true
    });
  }

  createButtons() {
    const { height } = this.scale;

    const left = this.add.rectangle(80, height - 80, 120, 80, 0x000000, 0.5)
      .setInteractive();
    this.add.text(left.x, left.y, "LEFT", { color: "#fff" }).setOrigin(0.5);

    left.on("pointerdown", () => this.moveLeft = true);
    left.on("pointerup", () => this.moveLeft = false);
    left.on("pointerout", () => this.moveLeft = false);

    const right = this.add.rectangle(220, height - 80, 120, 80, 0x000000, 0.5)
      .setInteractive();
    this.add.text(right.x, right.y, "RIGHT", { color: "#fff" }).setOrigin(0.5);

    right.on("pointerdown", () => this.moveRight = true);
    right.on("pointerup", () => this.moveRight = false);
    right.on("pointerout", () => this.moveRight = false);
  }

  spawnHurdle() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(120, this.scale.width - 120);
    const h = this.hurdles.create(x, -50, "hurdle");
    h.setScale(0.6);
    h.setVelocityY(300);
  }

  update() {
    if (this.isGameOver) return;

    /* ===== BACKGROUND SCROLL ===== */
    this.bg1.y += this.speed;
    this.bg2.y += this.speed;

    if (this.bg1.y >= this.scale.height * 1.5) {
      this.bg1.y = this.bg2.y - this.scale.height;
    }

    if (this.bg2.y >= this.scale.height * 1.5) {
      this.bg2.y = this.bg1.y - this.scale.height;
    }

    /* ===== BIKE MOVEMENT ===== */
    this.bike.setVelocityX(0);
    this.bike.setRotation(0);

    if (this.moveLeft || this.cursors.left.isDown) {
      this.bike.setVelocityX(-300);
      this.bike.setRotation(-0.12);
    }

    if (this.moveRight || this.cursors.right.isDown) {
      this.bike.setVelocityX(300);
      this.bike.setRotation(0.12);
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000"
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width / 2, height / 2 + 40, 200, 60, 0x00aa00)
      .setInteractive();

    this.add.text(btn.x, btn.y, "RESTART", { color: "#fff", fontSize: "24px" })
      .setOrigin(0.5);

    btn.on("pointerdown", () => this.scene.restart());
  }
}

/* ===== CONFIG ===== */
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: { default: "arcade" },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: BikeScene
};

const game = new Phaser.Game(config);

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
