import Phaser from 'phaser';
import "./style.css"
// import { POKEMON } from './pokemon';
import scene1 from './scene1';
import scene2 from './scene2';
import scene3 from './scene3';
import scene4 from './scene4';
import scene5 from './scene5';

const config = {
    type: Phaser.AUTO,
    scale: {
      // mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY, // Center the game
    },
    width: 960,
    height: 540,
    scene: [scene1,scene2,scene3,scene4,scene5],

    backgroundColor: '#000000', 
};

new Phaser.Game(config);


