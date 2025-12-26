class BikeScene extends Phaser.Scene {
    constructor() {
        super("BikeScene");
    }

    preload() {
        this.load.image("bike", "assets/bike.png");
    }

    create() {
        console.log("BikeScene started!");

        this.add.text(250, 20, "2D Bike Simulator", { fontSize: "28px", fill: "#fff" });

        // Ground
        const ground = this.physics.add.staticSprite(400, 550, null)
            .setDisplaySize(800, 40)
            .setVisible(false);

        // Bike
        this.bike = this.physics.add.sprite(400, 300, "bike");
        this.bike.setScale(0.5);
        this.bike.setSize(200, 100).setOffset(100, 200);
        this.bike.setCollideWorldBounds(true);

        this.physics.add.collider(this.bike, ground);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        console.log("VelocityX:", this.bike.body.velocity.x);

        this.bike.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.bike.setVelocityX(-200);
        }

        if (this.cursors.right.isDown) {
            this.bike.setVelocityX(200);
        }

        if (this.cursors.up.isDown && this.bike.body.blocked.down) {
            this.bike.setVelocityY(-350);
        }
    }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#222",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BikeScene]
};


const game = new Phaser.Game(config);
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

