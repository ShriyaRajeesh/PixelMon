import { Character, CharacterConfig } from "./character";
import { Direction, DIRECTION } from "../direction";
import { Coordinate } from "../typedef";
import { CHARACTER_ASSET_KEYS } from "../asset_keys";

export class ProfessorOak extends Character {
    private dialogueQueue: { speaker: string, text: string }[] = [];
    private isTalking: boolean = false;

    constructor(config: CharacterConfig) {
        super({
                    ...config,
                    assetKey:CHARACTER_ASSET_KEYS.OAK,
                    assetFrame:0,
                });
        this.sprite.setScale(3)
        
    }

    startEncounter(callback?: () => void) {
        if (this.isTalking) return;
        this.isTalking = true;

        this.dialogueQueue = [
            { speaker: "Oak", text: "Wait! Don't go into the tall grass!" },
            { speaker: "Oak", text: "It's dangerous! Follow me to my lab!" }
        ];

        this.showNextDialogue(() => {
            this.leadPlayerToLab(callback);
        });
    }

    private showNextDialogue(onComplete?: () => void) {
        if (this.dialogueQueue.length === 0) {
            this.isTalking = false;
            if (onComplete) onComplete();
            return;
        }

        const dialogue = this.dialogueQueue.shift();
        this.scene.events.emit("showDialogue", dialogue?.speaker, dialogue?.text);

        this.scene.time.delayedCall(150, () => {
            this.showNextDialogue(onComplete);
        });
    }

    private leadPlayerToLab(callback?: () => void) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x , // Example movement
            y: this.sprite.y +100,
            duration: 5,
            onComplete: () => {
                if (callback) callback();
                this.scene.scene.start("scene5");
            }
        });
    }
    moveTo(target: { x: number; y: number }, onComplete?: () => void) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: target.x,
            y: target.y,
            duration: 2000,
            ease: "Linear",
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
    }
}
