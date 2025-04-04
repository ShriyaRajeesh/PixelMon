import Phaser from "phaser";
import { BATTLE_ASSET_KEYS, LAB_ASSET_KEYS } from "./asset_keys";
import { Player } from "./characters/player";
import { ProfessorOak } from "./characters/profOak";
import { DATA_MANAGER_KEYS, dataManager } from "./data_manager";
import { DIRECTION } from "./direction";
import { Controls } from "./controls";
import { POKEMON_DATA } from "./pokemon-data";
import { Pokemon } from "./typedef";
import { DialogueBox } from "./dialogue";

export default class scene5 extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private map!: Phaser.Tilemaps.Tilemap;
    private collisionLayer!: Phaser.Tilemaps.TilemapLayer|null;
    private foregroundLayer!: Phaser.GameObjects.Image;
    private starters: Phaser.GameObjects.Image[] = [];    
    private selectedPokemon: string = "";
    private player!: Player;
    private profOak!: ProfessorOak;
    private controls !:Controls;
    private selectedPokeball: Phaser.GameObjects.Sprite | null = null;
    private playerMovementEnabled: boolean = true; 
    private activeSelection: boolean = false;
    private dialogueBox!:DialogueBox;
    constructor() {
        super("scene5");
    }

    create() {
        
        this.dialogueBox = new DialogueBox(this);
        
        this.map = this.make.tilemap({ key: LAB_ASSET_KEYS.LAB_MAIN_LEVEL });

        const collisionTileset = this.map.addTilesetImage("collision", LAB_ASSET_KEYS.LAB_COLLISION);

        if (!collisionTileset) {
            console.error("Tileset loading failed!");
            return;
        }
        this.add.image(0, 0, LAB_ASSET_KEYS.LAB, 0).setOrigin(0);

        this.collisionLayer = this.map.createLayer("Collision", collisionTileset, 0, 0);
        this.collisionLayer?.setVisible(false);
        

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
    
    
        this.starters = [
            this.add.image(350, 360, BATTLE_ASSET_KEYS.POKEBALL).setInteractive().setData("pokemon", "bulbasaur").setScale(0.25),
            this.add.image(450, 360, BATTLE_ASSET_KEYS.POKEBALL).setInteractive().setData("pokemon", "charmander").setScale(0.25),
            this.add.image(550, 360, BATTLE_ASSET_KEYS.POKEBALL).setInteractive().setData("pokemon", "squirtle").setScale(0.25)
        ];
        this.player = new Player({
            scene: this,
            position: { x: 330 , y: 620 },
            direction:  dataManager.storeData.get(DATA_MANAGER_KEYS.PLAYER_DIRECTION),
            collisionLayer: this.collisionLayer
        });
        this.profOak = new ProfessorOak({
            scene: this,
            assetKey: "professor_oak",
            position: { x: 400 , y: 200 },
            direction: DIRECTION.LEFT,
        });
        this.foregroundLayer = this.add.image(0, 0, LAB_ASSET_KEYS.LAB_FOREGROUND).setOrigin(0, 0);

        this.cameras.main.startFollow(this.player.sprite);
            this.input.keyboard?.on("keydown-ENTER", () => {
                const pokeball = this.getNearbyPokeball();
                if (pokeball) {
                    this.showPokemonDetails(pokeball.getData("pokemon"));
                }
            });

        this.controls = new Controls(this);
        this.player.lockMovement()
        const dialogue = [
            { speaker: "Prof. Oak", text: "Go ahead!" },
            { speaker: "Prof. Oak", text: "Your first partner awaits!" },
            { speaker: "Prof. Oak", text: "Just approach whichever Pokémon calls to you." }
            ];
        this.dialogueBox.showDialogue(dialogue, () => {
            this.player.unlockMovement();
        });
}

    getNearbyPokeball(): Phaser.GameObjects.Image | null {
        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y - 40; // Adjusted for player sprite offset

        const interactionRange = 70; // Increased range for better detection

        for (const pokeball of this.starters) {
            const pokeballX = pokeball.x;
            const pokeballY = pokeball.y;

            // Visual debug - draw hit areas (remove in production)
            // this.add.circle(pokeballX, pokeballY, interactionRange, 0xff0000, 0.3).setDepth(100);

            const distance = Phaser.Math.Distance.Between(playerX, playerY, pokeballX, pokeballY);

            if (distance <= interactionRange) {
                return pokeball;
            }
        }
        return null;
    }
    update(time: DOMHighResTimeStamp) {
    
    if (this.playerMovementEnabled) {
        const selectedDirection = this.controls.getDirectionKeyPressedDown();
        if (selectedDirection !== DIRECTION.NONE) {
            this.player.moveCharacter(selectedDirection);
        }
    }
    this.player.update(time);
    this.player.unlockMovement();

        
    }
    private showPokemonDetails(pokemonName: string) {
        if (this.activeSelection) return; 
        this.activeSelection = true;
        this.playerMovementEnabled = false;

        // Create a container to hold all elements
        const container = this.add.container(0, 0);

        // Add the details box
        const detailsBox = this.add.rectangle(400, 300, 300, 200, 0x000000, 0.8).setDepth(5);
        container.add(detailsBox);

        // Add the text
        const text = this.add.text(320, 250, `Choose ${pokemonName}?`, { fontSize: "18px", color: "#fff" }).setDepth(6);
        container.add(text);

        // Display Pokémon sprite
        const pokemonSprite = this.add.sprite(400, 350, `${pokemonName}_front`).setDepth(6).setScale(2);
        container.add(pokemonSprite);

        // Create animation if it doesn't exist yet
        if (!this.anims.exists(`${pokemonName}_front`)) {
            this.anims.create({
                key: `${pokemonName}_front`,
                frames: this.anims.generateFrameNames(`${pokemonName}_front`),
                frameRate: 5,
                repeat: -1,
            });
        }
        pokemonSprite.play(`${pokemonName}_front`)

        // Keyboard event listeners
        const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        const shiftKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        const confirmSelection = () => {
            this.confirmChoice(pokemonName);
            cleanup();
        };

        const cancelSelection = () => {
            cleanup();
        };

        const cleanup = () => {
            // Destroy everything in the container
            container.destroy();
            enterKey?.off("down", confirmSelection);
            shiftKey?.off("down", cancelSelection);
            this.activeSelection = false; // Allow new selection
            this.playerMovementEnabled = true;
        };

        enterKey?.on("down", confirmSelection);
        shiftKey?.on("down", cancelSelection);
}

    private selectPokeball(direction: number) {
        const pokeballs = this.starters.getChildren() as Phaser.GameObjects.Sprite[];
        if (pokeballs.length === 0) return;

        let index = this.selectedPokeball ? pokeballs.indexOf(this.selectedPokeball) : 0;
        index = (index + direction + pokeballs.length) % pokeballs.length; // Cycle through

        if (this.selectedPokeball) {
            this.selectedPokeball.clearTint(); // Remove highlight
        }

        this.selectedPokeball = pokeballs[index];
        this.selectedPokeball.setTint(0xffff00); // Highlight new selection
    }
private confirmChoice(pokemon: string) {
    console.log(`You selected ${pokemon}`);
    const pokemonName = pokemon;
    
    const pokemonDetails = Object.values(POKEMON_DATA)
      .filter((p): p is Pokemon => p !== undefined) // Ensure TypeScript knows it's a Pokemon object
        .find((p) => p.name === pokemonName);
    
    if (!pokemonDetails) {
        console.error(`Error: Pokémon "${pokemonName}" not found in POKEMON_DATA.`);
    } else {
        const team = [pokemonDetails]; // Ensure it's an array with a valid Pokémon
        console.log(team);
        dataManager.updatePlayerTeam(team); // Assuming updatePlayerTeam expects an array of valid Pokémon
    }
     // Ensure Player class has this method
    this.cameras.main.fadeOut(2600, 0, 0, 0);

this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.start("scene4");

    // Ensure the camera is available before performing any actions
    this.scene.get('scene4').events.once('shutdown', () => {
        // The scene has been shut down, camera should be accessible now.
        this.scene.get('scene4').cameras.main.fadeIn(2000);
    });
});
    
}
}