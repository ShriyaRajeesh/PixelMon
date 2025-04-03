import Phaser from "phaser";
import "./style.css";
import { PLAYER_POKEMON_TEAM } from "./player-pokemon-list";
import { BATTLE_ASSET_KEYS, CHARACTER_ASSET_KEYS, LAB_ASSET_KEYS, WORLD_ASSET_KEYS } from "./asset_keys";
import { POKEMON_DATA } from "./pokemon-data";


export default class scene1 extends Phaser.Scene
{
    constructor(){
        super("bootGame");
    }
    preload()
    {
        for (const pokemon of Object.values(POKEMON_DATA)) {
            this.load.atlas(`${pokemon.name}_front`, `src/assets/pokemon/${pokemon.name}_front.png`,`src/assets/pokemon_json/${pokemon.name}_front.json`);
            this.load.atlas(`${pokemon.name}_back`, `src/assets/pokemon/${pokemon.name}_back.png`,`src/assets/pokemon_json/${pokemon.name}_back.json`);

        }
        // .forEach((pokemon) => {
        //         });
        // PLAYER_POKEMON_TEAM.forEach((pokemon) => {
        //     this.load.atlas(`${pokemon.name}_back`, `src/assets/pokemon/${pokemon.name}_back.png`,`src/assets/pokemon_json/${pokemon.name}_back.json`);
        // });
        this.load.image("startscreen","src/assets/images/startscreen.jpg");
        //pallet town data 
        this.load.image(WORLD_ASSET_KEYS.PALLET_TOWN, "src/assets/cities/cities/level_background.png")
        this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.PALLET_MAIN_LEVEL, "src/assets/cities/cities/level.json")
        this.load.image(WORLD_ASSET_KEYS.PALLET_COLLISION, "src/assets/cities/cities/collision.png")
        this.load.image(WORLD_ASSET_KEYS.PALLET_FOREGROUND, "src/assets/cities/cities/level_foreground.png")
        this.load.image(WORLD_ASSET_KEYS.PALLET_ENCOUNTER_ZONE, "src/assets/cities/cities/encounter.png")

        //loading lab assets 
        this.load.image(LAB_ASSET_KEYS.LAB, "src/assets/lab/lab_map.png")
        this.load.tilemapTiledJSON(LAB_ASSET_KEYS.LAB_MAIN_LEVEL, "src/assets/lab/lab_map.json")
        this.load.image(LAB_ASSET_KEYS.LAB_COLLISION, "src/assets/lab/collision.png")
        this.load.image(LAB_ASSET_KEYS.LAB_FOREGROUND, "src/assets/lab/lab_foreground.png")

        
        //loading character assets
        this.load.atlas(CHARACTER_ASSET_KEYS.PLAYER,"src/assets/player/male_sprite.png", "src/assets/player/male_sprite.json");
        this.load.atlas(CHARACTER_ASSET_KEYS.NPC,"src/assets/player/npc.png", "src/assets/player/npc.json");
        this.load.image(CHARACTER_ASSET_KEYS.OAK,"src/assets/player/profOak.png");
        //loading pokeball
        this.load.image(BATTLE_ASSET_KEYS.POKEBALL, "src/assets/images/pokeball.png")
    }
    create() {
        this.add.image(480, 270, "startscreen"); // Add the image
    
        this.add.text(480, 350, "Press Enter to Start", {
            font: "48px DigitalClock", // Use your custom font
            color: "#ffffff",
            stroke: "#000000", // Black outline
            strokeThickness: 6,
        }).setOrigin(0.5); // Center the text
        

        // Add input listener for the "Enter" key
        const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // Ensure `enterKey` is not null
        if (!enterKey) {
            console.error("Keyboard plugin or 'Enter' key mapping is not available.");
            return;
        }
        this.createAnimations();
        this.scene.start("scene4");


        // Start the next scene when the "Enter" key is pressed
        enterKey.on("down", () => {
            if (this.scene) {
                this.scene.start("scene4");
            } else {
                console.error("Scene Manager is not available.");
            }
        });
    }

    createAnimations(){
        this.anims.create({
            key: "PLAYER_DOWN",
            frames:this.anims.generateFrameNames(CHARACTER_ASSET_KEYS.PLAYER,{start:1, end:2, prefix:'walking_down000'}),
            repeat: -1,
            frameRate:15 

        });
        this.anims.create({
            key: "PLAYER_UP",
            frames:this.anims.generateFrameNames(CHARACTER_ASSET_KEYS.PLAYER,{start:1, end:5, prefix:'walking_up000'}),
            repeat: -1,
            frameRate:15 

        });
        this.anims.create({
            key: "PLAYER_LEFT",
            frames:this.anims.generateFrameNames(CHARACTER_ASSET_KEYS.PLAYER,{start:1, end:6, prefix:'walking_left000'}),
            repeat: -1,
            frameRate:15 

        });
        this.anims.create({
            key: "PLAYER_RIGHT",
            frames:this.anims.generateFrameNames(CHARACTER_ASSET_KEYS.PLAYER,{start:1, end:5, prefix:'walking_right000'}),
            repeat: -1,
            frameRate:15 

        });
    }
    
    
}