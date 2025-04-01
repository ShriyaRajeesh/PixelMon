// import Phaser from "phaser";

// export class DialogueBox extends Phaser.GameObjects.Container {
//     private box: Phaser.GameObjects.Graphics;
//     private text: Phaser.GameObjects.Text;
//     private isActive: boolean = false;
//     private dialogueQueue: { speaker: string, text: string }[] = [];
//     private onComplete?: () => void;

//     constructor(scene: Phaser.Scene) {
//         super(scene);
//         this.scene = scene;
//         if (this.scene && this.scene.cameras && this.scene.cameras.main) {
//         const camera = this.scene.cameras.main;
//         const width = camera.width;
//         const height = camera.height;

//         // Create dialogue box background
//         this.box = this.scene.add.graphics();
//         this.box.fillStyle(0x000000, 0.8);
//         this.box.fillRoundedRect(0, 75, width - 50, 100, 10); // Position within container

//         // Create dialogue text
//         this.text = this.scene.add.text(20, 95, "", {
//             fontSize: "25px",
//             color: "#ffffff",
//             wordWrap: { width: width - 140 }
//         });

//         // Add graphics and text to the container
//         this.add([this.box, this.text]);

//         // Set depth and visibility
//         this.setDepth(1000);
//         this.setVisible(false);

//         // Add container to the scene
//         this.scene.add.existing(this);

//         // Ensure the dialogue box stays at the bottom of the screen
//         this.scene.events.on("update", this.updatePosition, this);

//         // Add key listener to progress dialogue
//         this.scene.input.keyboard?.on("keydown-ENTER", () => {
//             if (this.isActive) {
//                 this.showNextDialogue();
//             }
//         });

//         // Initial positioning
//         this.updatePosition();}
//     }

//     private updatePosition() {
//         if (this.scene && this.scene.cameras && this.scene.cameras.main) {
//         const camera = this.scene.cameras.main;
//         const height = camera.height;

//         // Set position relative to camera
//         this.setPosition(camera.scrollX + 50, camera.scrollY + height - 120);
//     }}

//     showDialogue(dialogues: { speaker: string, text: string }[], onComplete?: () => void) {
//         console.log("inside showDialogue");
//         this.dialogueQueue = dialogues;
//         this.onComplete = onComplete;
//         this.isActive = true;
//         this.setVisible(true);
//         this.showNextDialogue();
//     }

//     private showNextDialogue() {
//         if (this.dialogueQueue.length === 0) {
//             this.hideDialogue();
//             if (this.onComplete) this.onComplete();
//             return;
//         }

//         const dialogue = this.dialogueQueue.shift();
//         this.typeWriterEffect(dialogue?.text || "");
//     }

//     private typeWriterEffect(text: string) {
//         let i = 0;
//         this.text.setText("");

//         const timer = this.scene.time.addEvent({
//             delay: 50,
//             callback: () => {
//                 if (i < text.length) {
//                     this.text.text += text[i];
//                     i++;
//                 } else {
//                     timer.remove();
//                 }
//             },
//             loop: true
//         });
//     }

//     private hideDialogue() {
//         this.isActive = false;
//         this.setVisible(false);
//     }
// }
import Phaser from "phaser";

export class DialogueBox extends Phaser.GameObjects.Container {
    private box: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private isActive: boolean = false;
    private dialogueQueue: { speaker: string, text: string }[] = [];
    private onComplete?: () => void;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene = scene;
        
        // Create dialogue box background
        this.box = this.scene.add.graphics();
        this.box.fillStyle(0x000000, 0.8);
        this.box.fillRoundedRect(0, 0, 700, 100, 10); // Fixed size instead of camera-relative

        // Create dialogue text
        this.text = this.scene.add.text(20, 20, "", {
            fontSize: "25px",
            color: "#ffffff",
            wordWrap: { width: 660 } // Fixed width to match box
        });

        // Add graphics and text to the container
        this.add([this.box, this.text]);

        // Set container properties
        this.setDepth(1000);
        this.setVisible(false);
        this.setScrollFactor(0); // This makes it stay fixed on screen

        // Add container to the scene
        this.scene.add.existing(this);

        // Position at bottom center of screen
        this.setPosition(
            (this.scene.game.config.width as number) / 2 - 350, // Center horizontally
            (this.scene.game.config.height as number) - 120 // Fixed position from bottom
        );

        // Add key listener to progress dialogue
        this.scene.input.keyboard?.on("keydown-ENTER", () => {
            if (this.isActive) {
                this.showNextDialogue();
            }
        });
    }

    showDialogue(dialogues: { speaker: string, text: string }[], onComplete?: () => void) {
        this.dialogueQueue = dialogues;
        this.onComplete = onComplete;
        this.isActive = true;
        this.setVisible(true);
        this.showNextDialogue();
    }

    private showNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.hideDialogue();
            if (this.onComplete) this.onComplete();
            return;
        }

        const dialogue = this.dialogueQueue.shift();
        this.typeWriterEffect(dialogue?.text || "");
    }

    private typeWriterEffect(text: string) {
        let i = 0;
        this.text.setText("");

        const timer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (i < text.length) {
                    this.text.text += text[i];
                    i++;
                } else {
                    timer.remove();
                }
            },
            loop: true
        });
    }

    hideDialogue() {
        this.isActive = false;
        this.setVisible(false);
    }
}