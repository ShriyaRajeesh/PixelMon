import Phaser from 'phaser';
import { Coordinate } from '../typedef';
import { CHARACTER_ASSET_KEYS } from '../asset_keys';
import { Player } from './player';


class Npc {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private position: Coordinate;

  constructor(scene: Phaser.Scene, position: Coordinate) {
    this.scene = scene;
    this.position = position;
    this.sprite = scene.add.sprite(position.x, position.y, CHARACTER_ASSET_KEYS.NPC); // Use your NPC sprite key
    this.sprite.setScale(3); // Adjust scale as needed
  }
  public get getsprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
}

  isNearPlayer(playerPosition: Coordinate): boolean {
    return Math.abs(playerPosition.x - this.position.x) + Math.abs(playerPosition.y - this.position.y) <= 100;
  }

  // Method to display a greeting when the player is near
  displayGreeting() {
    const boxWidth = 300;
    const boxHeight = 100;
  
    // Create a background box for the dialogue
    const dialogueBox = this.scene.add.graphics();
    dialogueBox.fillStyle(0xffffff, 1);
    dialogueBox.fillRoundedRect(this.position.x - boxWidth / 2, this.position.y - 100, boxWidth, boxHeight, 10);
  
    // Create the text object for the greeting
    const dialogueText = this.scene.add.text(this.position.x - boxWidth / 2 + 10, this.position.y - 90, 'Hello Trainer!', {
      fontSize: '16px',
      color: '#000',
      wordWrap: { width: boxWidth - 20 },
    });
  
    // After 2 seconds, update the text to ask to fight
    this.scene.time.delayedCall(500, () => {
      dialogueText.setText('Press Z if you want to fight.');
  
      // Listen for the Z key
    })
  }
}
export default Npc;
