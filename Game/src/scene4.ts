    import Phaser from "phaser";
import { DATA_ASSET_KEYS, RESTORE, WORLD_ASSET_KEYS } from "./asset_keys";
import { Player } from "./characters/player";
import { Coordinate } from "./typedef";
import { Controls } from "./controls";
import { DIRECTION } from "./direction";
import { DATA_MANAGER_KEYS, dataManager } from "./data_manager";
import Npc from "./characters/npc"; // Import the Npc class
import { POKEMON } from "./asset_keys";
import { Pokemon } from "./typedef";
import { POKEMON_DATA } from "./pokemon-data";
import { Character } from "./characters/character";
import { ProfessorOak } from "./characters/profOak";
import { DialogueBox } from "./dialogue";

const TILE_SIZE=64;
const HPX=[11 , 23 , 48  ];
const HPY=[9.5, 6.5 , 19];

export default class scene4 extends Phaser.Scene {
    private player!: Player;
    private controls!: Controls;
    private encounterLayer!: Phaser.Tilemaps.TilemapLayer;
    private wildPokemonEncountered!: boolean;
    private playerTeam: any[];
    private npc!: Npc; // Add npc property
    private profOak!: ProfessorOak; // Use ProfessorOak class
    private oakEventTriggered: boolean = false;
    private dialogueBox!: DialogueBox;
    private opponentTeam: Pokemon[] = [
        POKEMON_DATA.CHIKORITA,
        POKEMON_DATA.GEODUDE,
        // Add more Pokémon here
    ];
    private heartSprites! : Phaser.GameObjects[];

    constructor() {
        super("scene4");
        this.playerTeam = [];
        this.heartSprites = [];
    }
    preload() {
    }
    
    init() {
        this.wildPokemonEncountered = false;

    }

    create() {
    
        
        // Create the animation once
       
        this.cameras.main.setBounds(0, 0, 3200, 2176);
        this.cameras.main.setZoom(0.8);
        // this.cameras.main.centerOn(x,y);

        const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.PALLET_MAIN_LEVEL });
        const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.PALLET_COLLISION);
        const collisionlayer = map.createLayer('Collision', collisionTiles, 0, 0);
        if (!collisionlayer) {
            console.log("error while creating collsion layer");
        }
        const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.PALLET_ENCOUNTER_ZONE);

        this.encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
        if (!this.encounterLayer) {
            console.log("error while creating encounter layer");
        }

        // collisionlayer?.setDepth(2);
        // this.encounterLayer?.setDepth(2);
       
        this.add.image(0, 0, WORLD_ASSET_KEYS.PALLET_TOWN, 0).setOrigin(0);

        this.anims.create({
            key: RESTORE.HEART,
            frames: this.anims.generateFrameNames(RESTORE.HEART),
            frameRate: 5,
            repeat: -1,
        });
        
        for (let i = 0; i < HPX.length; i++) {
            const x = TILE_SIZE * HPX[i];
            const y = TILE_SIZE * HPY[i];
        
            const heartSprite = this.add.sprite(x, y, RESTORE.HEART).setScale(0.25);
            heartSprite.play(RESTORE.HEART);
        
            this.heartSprites.push({
                sprite: heartSprite,
                x: x,
                y: y,
                collected: false,
            });
        }

        this.player = new Player({
            scene: this,
            position: dataManager.storeData.get(DATA_MANAGER_KEYS.PLAYER_POSTION),
            direction: dataManager.storeData.get(DATA_MANAGER_KEYS.PLAYER_DIRECTION),
            collisionLayer: collisionlayer,
            spriteGridMovementFinishedCallBack: () => {
                this.handlePlayerMovementUpdate();
            }
        });

       
        
        this.cameras.main.startFollow(this.player.sprite);
        this.add.image(0, 0, WORLD_ASSET_KEYS.PALLET_FOREGROUND, 0).setOrigin(0);

        this.controls = new Controls(this);
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        

        // Create NPC instance
        this.npc = new Npc(this, { x: 300, y: 300 });

        this.dialogueBox = new DialogueBox(this);
        this.events.on('wake', () => {
            // Ensure dialogue box is hidden when returning from battle
            this.dialogueBox.hideDialogue();
            this.player.unlockMovement();
        });
    //   c
        
    }

    update(time: DOMHighResTimeStamp) {
        if (this.wildPokemonEncountered) {
            this.player.update(time);
            return;
        }
        const selectedDirection = this.controls.getDirectionKeyPressedDown();
        if (selectedDirection !== DIRECTION.NONE) {
            this.player.moveCharacter(selectedDirection);
        }

        this.player.update(time);

        const playerPosition = {
            x: this.player.sprite.x,
            y: this.player.sprite.y,
        };

        if (this.npc.isNearPlayer(playerPosition)) {
            if (!this.dialogueBox.visible) {  // Prevent multiple calls
                const dialogue = [
                    { speaker: "NPC", text: "I've been waiting for a real challenge!" },
                    { speaker: "NPC", text: "Don't let me down!" }
                ];
                this.dialogueBox.showDialogue(dialogue, () => {
                    this.startBattleScene();
                });
            }
        }
        else if (this.dialogueBox.visible && !this.oakEventTriggered) {
            // Only hide if not in Oak's event and player moved away
            this.dialogueBox.hideDialogue();
        }
        
        
    }

    handlePlayerMovementUpdate() {
        dataManager.storeData.set(DATA_MANAGER_KEYS.PLAYER_POSTION, {
            x: this.player.sprite.x,
            y: this.player.sprite.y,
        });

        dataManager.storeData.set(DATA_MANAGER_KEYS.PLAYER_DIRECTION, this.player.directionGetter);

        if (!this.encounterLayer) {
            return;
        }
        const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;

    // Define the range
    const minX = 9 * TILE_SIZE;
    const maxX = 13 * TILE_SIZE;
    const minY = 17 * TILE_SIZE;
    const maxY = 17 * TILE_SIZE;

    
    // Check if the player is within the range and has no Pokémon
    if (
        this.player.getPokemonTeam().length === 0 &&
        playerX > minX && playerX < maxX &&
        playerY >= minY && playerY <= maxY
    ) {
        this.triggerProfessorOakEvent();
        return;
    }
    const COLLISION_RADIUS = TILE_SIZE * 0.5;

for (let i = 0; i < this.heartSprites.length; i++) {
    const heart = this.heartSprites[i];

    if (heart.collected) continue; // skip already collected

    const hpXmin = heart.x - COLLISION_RADIUS;
    const hpXmax = heart.x + COLLISION_RADIUS;
    const hpYmin = heart.y - COLLISION_RADIUS;
    const hpYmax = heart.y + COLLISION_RADIUS;

    if (
        playerX >= hpXmin && playerX <= hpXmax &&
        playerY >= hpYmin && playerY <= hpYmax
    ) {
        this.restoreHp(); // Heal the player
        heart.sprite.destroy(); // Remove the heart
        heart.collected = true; // Mark as collected
        return;
    }
}
    // Check if the player is in an encounter zone
    const isInEncounterZone = this.encounterLayer.getTileAtWorldXY(playerX, playerY, true).index !== -1;
    if (!isInEncounterZone) {
        return;
    }

        this.wildPokemonEncountered = Math.random() < 0.4;
        if (this.wildPokemonEncountered) {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.player.getPokemonTeam().forEach(pokemon => {
                    console.log(`${pokemon.name}: ${pokemon.currentHp} HP`);
                });
                this.scene.start("scene2", { player: this.player });
            });
        }
    }



    private triggerProfessorOakEvent() {
        if (this.oakEventTriggered) return;
        this.oakEventTriggered = true;

        console.log("Professor Oak appears!");

        this.player.lockMovement();
        

        // Create Professor Oak instance
        this.profOak = new ProfessorOak({
            scene: this,
            assetKey: "professor_oak",
            position: { x: this.player.sprite.x -25 , y: this.player.sprite.y - 100 },
            direction: DIRECTION.LEFT,
        });

        // Start the encounter

        this.dialogueBox.showDialogue([
            { speaker: "Oak", text: "Wait! Don't go into the tall grass!" },
            { speaker: "Oak", text: "It's dangerous! Come with me" }
        ], () => {
            // Start fade out
            this.cameras.main.fadeOut(100, 0, 0, 0);
            
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.profOak.startEncounter(() => {
                    console.log("Transitioning to lab...");
                    this.scene.start("scene5", {
                        playerPosition: { x: 200, y: 300 },
                        profOakPosition: { x: 300, y: 500 }
                    });
                });
            });
        });
    }

    


    private startBattleScene() {
        if (this.player && this.opponentTeam) {

            this.dialogueBox.hideDialogue();
            this.scene.start('scene2', {
                player: this.player,
                opponentTeam: this.opponentTeam,
                canCatch: false
            });
        } else {
        console.error('Missing player or opponentTeam');
        }
    }
    private restoreHp() {
        this.player.getPokemonTeam().forEach(pokemon => {
            pokemon.currentHp = pokemon.maxHp;
        });
    }
    
}