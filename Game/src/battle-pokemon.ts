import Phaser from "phaser";
import { HealthBar } from "./health-bar";
import {Pokemon , BattlePokemonConfig , Coordinate ,Attack} from "./typedef"
import { DATA_ASSET_KEYS } from "./asset_keys";
import { TYPE_EFFECTIVENESS } from "./type-effectiveness";
import { dataManager } from "./data_manager";
import { POKEMON_DATA } from "./pokemon-data";
import { POKEMON } from "./asset_keys";

// import { BattleMenu } from "./battle-menu";

export class BattlePokemon {
    protected _scene: Phaser.Scene;
    protected _pokemonDetails: Pokemon;
    protected _phaserGameObject: Phaser.GameObjects.Sprite;
    protected _healthBar!: HealthBar;
    protected pokemonAttacks: Attack[];
    public currentHealth: number;
    public maxHealth: number;
    protected _phaserHealthBarGameContainer!: Phaser.GameObjects.Container;
    protected _pokemonNameText !:Phaser.GameObjects.Text;
    protected data: any;
    public type: string;
    protected _healthBarText!: Phaser.GameObjects.Text;
    private _level: number;
    private _experience: number;
    private _experienceToNextLevel: number;
    private _pokemonLevelText!: Phaser.GameObjects.Text;
    public evolveTo: string ;
   public  evolutionLevel: number;


    constructor(config: BattlePokemonConfig, position: Coordinate ) {
        this._scene = config.scene;
        this._pokemonDetails = config._pokemonDetails;
        this.currentHealth = this._pokemonDetails.currentHp;
        this.maxHealth=this._pokemonDetails.maxHp;
        this.pokemonAttacks = [];
        this.type = this._pokemonDetails.type; 
        this._level = config._pokemonDetails.currentLevel || 1;
        this._experience = 0; // Initialize experience to 0
        this._experienceToNextLevel = this.calculateExperienceToNextLevel(this._level);
        this.evolveTo = this._pokemonDetails.evolvesTo;
        this.evolutionLevel = this._pokemonDetails.evolutionLevel;

    


        const animationKey = `${this._pokemonDetails.name}_animation`;
        if (!this._scene.anims.exists(animationKey)) {
            this._scene.anims.create({
                key: animationKey,
                frames: this._scene.anims.generateFrameNames(this._pokemonDetails.assetKey),
                frameRate: 5,
                repeat: -1,
            });
        }   
    this.createHealthBarComponents();
    this._phaserGameObject = this._scene.add.sprite(position.x /*700*/, position.y/*200*/, this._pokemonDetails.name);
    this._phaserGameObject.setScale(3);

    this._phaserGameObject.play(animationKey);

    this.data = this._scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS);


    this._pokemonDetails.attackIds.forEach((attackId) => {
        const pokemonAttack = this.data.find((attack:{id:number}) => attack.id === attackId);
        if (pokemonAttack !== undefined) {
            this.pokemonAttacks.push(pokemonAttack);
        }
    });
    
    }
    get pokemonID():number{
        return this._pokemonDetails.PokemonId;
    }

    get isFainted():boolean {
        return this.currentHealth<=0;
        }


    get name() :string{
        return this._pokemonDetails.name;
        }

        /** @type {Attack} */
    get attacks() {
        return this.pokemonAttacks;
        }

    get baseAttack():number {
    return this._pokemonDetails.baseAttack;
    }

    

    takeDamage(damage: number, attackType: string, callback?: () => void) {
        // Calculate type effectiveness multiplier
        const effectiveness = this.calculateTypeEffectiveness(attackType);
        const finalDamage = Math.floor(damage * effectiveness);
    
        this.currentHealth -= finalDamage;
    
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
        }
        
        this._healthBar.setMeterPercentageAnimated(this.currentHealth / this.maxHealth, {
            callback: callback
        });
    
        // Update the health bar text
        this.setHealthBarText();
        this.attackAnimation(() => {
            console.log(`${this.name} finished attacking!`);
        });
        return [effectiveness, this.currentHealth] ;
    }
    
    private calculateTypeEffectiveness(attackType: string): number {
        // Get the effectiveness table for the attacking type
        const attackTypeTable = TYPE_EFFECTIVENESS[attackType as keyof typeof TYPE_EFFECTIVENESS];
        
        // console.log('Attack Type:', attackType);
        // console.log('Defending Type:', this.type);
        // console.log('Attack Type Table:', attackTypeTable);
        
        if (!attackTypeTable) {
            console.log('No effectiveness table found for attack type, returning 1');
            return 1; // If attacking type isn't in the table, return neutral damage
        }

        // Look up the effectiveness against the defending type
        const effectiveness = attackTypeTable[this.type as keyof typeof TYPE_EFFECTIVENESS[keyof typeof TYPE_EFFECTIVENESS]];
        // console.log('Calculated Effectiveness:', effectiveness);
        
        return effectiveness ?? 1; // Return 1 if no specific effectiveness is defined
    }

    setHealthBarText() {
        
        if (this._healthBarText) {
            this._healthBarText.setText(`${this.currentHealth}/${this.maxHealth}`);
        }
    }


createHealthBarComponents() {
    this._healthBar = new HealthBar(this._scene,34*0.75,34*0.75,(this.currentHealth/this.maxHealth)*360*0.75); 

    this._pokemonNameText = this._scene.add.text(
        30*0.75,
        20*0.75,
        this.name,
        {
            color:'#000000' ,
            fontSize: '22px',
        }
    );
    
    this._pokemonLevelText = this._scene.add.text(
        this._pokemonNameText.width + 40 * 0.75,
        26 * 0.75,
        `Lvl ${this._pokemonDetails.currentLevel}`,
        {
            color: "#000000",
            fontSize: "16px",
        }
        );

    const pokemonHPText = this._scene.add.text(
        30*0.75,
        55*0.75,
        "HP",
        {
            color:'#000000' ,
            fontSize: '16px',
            fontStyle:'italic',
        }
    );
    const healthbarBackground = this._scene.add.image(0, 0, "healthbar_background");
    healthbarBackground.setScale(0.75); // Adjust size of health bar background
    healthbarBackground.setOrigin(0, 0);
    this._healthBarText = this._scene.add.text(
        443 * 0.75,
        90 * 0.75,
        `${this.currentHealth}/${this.maxHealth}`,
        {
            color: '#000000',
            fontSize: '15px',
        }
    ).setOrigin(1, 0);
    // console.log("in battle pokemon HP ", this.currentHealth);
    
    

    this._phaserHealthBarGameContainer = this._scene.add.container(50, 25, [
            healthbarBackground,
            this._pokemonNameText,
            this._pokemonLevelText,
            pokemonHPText,
            this._healthBar.container,
        
            this._healthBarText
    ]);


    }

    hidePokemon(){
        this._phaserGameObject.setAlpha(0);
        this._phaserHealthBarGameContainer.setAlpha(0);


    }
    showPokemon(){
        this._phaserGameObject.setAlpha(1);
        this._phaserHealthBarGameContainer.setAlpha(1);


    }

    switchPokemon(pokemon:Pokemon){
        this._pokemonDetails = pokemon;
        this.currentHealth = this._pokemonDetails.currentHp;
        console.log("in switchPokemon in battle pokemon ", this.currentHealth);
        this.maxHealth= this._pokemonDetails.maxHp;
        this._healthBar.setMeterPercentageAnimated(this.currentHealth/this.maxHealth,{
            skipBattleAnimations: true
        });
        
        this.pokemonAttacks=[];
        this._pokemonDetails.attackIds.forEach((attackId) => {
            const pokemonAttack = this.data.find((attack:{id:number}) => attack.id === attackId);
            if (pokemonAttack !== undefined) {
                this.pokemonAttacks.push(pokemonAttack);
            }
        });

        this._phaserGameObject.setTexture(this._pokemonDetails.assetKey, this._pokemonDetails.assetFrame ||0);
        this._pokemonNameText.setText(this._pokemonDetails.name);
        


    }

    playSwitchAnimation(newPokemon: Pokemon, callback?: () => void) {
        // Fade out the current Pokémon
        this._scene.tweens.add({
            targets: this._phaserGameObject,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                // Switch to the new Pokémon
                this.switchPokemon(newPokemon);
    
                // Fade in the new Pokémon
                this._scene.tweens.add({
                    targets: this._phaserGameObject,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        if (callback) callback();
                    }
                });
            }
        });
    }

    addExperience(experienceGained: number) {
        this._experience += experienceGained;
      
        // Check if the Pokémon should level up
        if (this._experience >= this._experienceToNextLevel) {
          this.levelUp();
        }
      
        // Update experience in data manager
        this.updateExperienceInDataManager();
      }

      private updateExperienceInDataManager() {
        const playerTeam = dataManager.getPlayerTeam();
        const index = playerTeam.findIndex(p => p.name === this.name);
      
        if (index !== -1) {
          dataManager.updatePokemonExperience(index, this._experience, this._level);
        }
    }
    
      // Method to level up the Pokémon
      private levelUp() {
        const levelsGained = Math.floor(this._experience / this._experienceToNextLevel);
    
        this._level += levelsGained;
        this._experience -= levelsGained * this._experienceToNextLevel;
    
        // Update experience needed for the next level
        this._experienceToNextLevel = this.calculateExperienceToNextLevel(this._level);
    
        // Update stats (for simplicity, just increase max HP and base attack)
        this.maxHealth += levelsGained * 5; // Example increase
        console.log(`Pokémon leveled up to level ${this._level}!`);
  this.updateLevelText();
      }
    
      // Function to calculate experience needed for the next level
      private calculateExperienceToNextLevel(level: number): number {
        // Simple formula for demonstration; adjust as needed
        return Math.floor(100 * Math.pow(level, 1.5));
    }
    
      // Getters for level and experience
    get level(): number {
        return this._level;
    }
    
    get experience(): number {
        return this._experience;
    }
    
    get experienceToNextLevel(): number {
        return this._experienceToNextLevel;
    }

    updateLevelText() {
        if (this._pokemonLevelText) {
            this._pokemonLevelText.setText(`Lvl ${this.level}`);
        }
    }

    attackAnimation(callback?: () => void): void {
        this._scene.tweens.add({
            targets: this._phaserGameObject,
            alpha: { from: 1, to: 0 }, // Flicker effect
            duration: 100,
            repeat: 4, // 4 flickers = 5 flashes
            yoyo: true,
            ease: "Linear",
            onComplete: () => {
                if (callback) callback(); // Call callback after animation
            },
        });
    }


    getPokemonDetailsByName(name: string): Pokemon | null {
        return POKEMON_DATA[name.toUpperCase()] || null;
     }
     

    evolvePokemon() {
        if (this.evolutionLevel !== null && this._level >= this.evolutionLevel) {
            if (this.evolveTo) {
                console.log(`${this.name} is evolving into ${this.evolveTo}!`);
    
                // Fetch evolved Pokémon details from data manager or predefined data
                const evolvedPokemon = this.getPokemonDetailsByName(this.evolveTo);
    
                if (evolvedPokemon) {
                    // Switch to the evolved Pokémon
                    this.replacePokemon(evolvedPokemon);
    
                    // Reset experience for the new Pokémon
                    this._experience = 0;
                    this._experienceToNextLevel = this.calculateExperienceToNextLevel(this._level);
    
                    console.log(`${this.name} has successfully evolved!`);
                } else {
                    console.error(`Failed to find details for evolved Pokémon: ${this.evolveTo}`);
                }
            } else {
                console.error(`${this.name} does not have a valid evolution target.`);
            }
        } else {
            console.log(`${this.name} has not met the required level (${this.evolutionLevel}) for evolution.`);
        }
    }

    replacePokemon(pokemonDetails: Pokemon) {

         
         
        const playerTeam = dataManager.getPlayerTeam();
        const index = playerTeam.findIndex(p => p.name === this.name);
        this.switchPokemon(pokemonDetails);
        if (index !== -1) {
          dataManager.replacePokemon(index, pokemonDetails);
        }

    
     }
    
}
    



