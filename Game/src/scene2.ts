import Phaser from "phaser";
import {POKEMON,BATTLE_ASSET_KEYS , HEALTH_BAR_ASSETS, CURSORS, DATA_ASSET_KEYS, CHARACTER_ASSET_KEYS} from "./asset_keys"
import { BattleMenu } from "./battle-menu";
import { DIRECTION } from "./direction";
import { StateMachine } from "./battle_state";
import { Background } from "./battle-background";
import { BattlePokemon } from "./battle-pokemon";
import { enemyPokemon } from "./enemy-pokemon";
import { playerPokemon } from "./player-pokemon";
import { PLAYER_POKEMON_TEAM } from "./player-pokemon-list";
import { Attack, Pokemon } from "./typedef";
import { POKEMON_DATA } from "./pokemon-data";
import { Controls } from "./controls";
import { Player } from "./characters/player";
import { dataManager } from "./data_manager";



const BATTLE_STATES = Object.freeze({
    INTRO : 'INTRO', //set up game objects 
    PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',// health bar opp pokemon
    BRING_OUT_PLAYER : 'BRING_OUT_PLAYER',// player pokemon + health BAR
    PLAYER_INPUT : 'PLAYER_INPUT',// battle menu  fight / run 
    ENEMY_INPUT : 'ENEMY_INPUT',// enemy chooses attack ai logic/ random 
    BATTLE : 'BATTLE' ,//switching who attacks damage
    POST_BATTLE_CHECK : 'POST_BATTLE_CHECK' ,//player ran a away switching etc
    FINISHED : 'FINISHED' ,// battle finish knock out the opp
    FLEE_ATTEMPT : 'FLEE_ATTEMPT', //run away
    SWITCH_POKEMON : 'SWITCH_POKEMON',
    CATCH_POKEMON:'CATCH_POKEMON',
    EVOLUTION:'EVOLUTION'
}) 

export default class scene2 extends Phaser.Scene {

    private battlemenu!: BattleMenu;
    private controls!:Controls
    private battleStateMachine!: StateMachine
    activeOpponentPokemon!:BattlePokemon;
    activePlayerPokemon!:BattlePokemon;
    private activePlayerAttackIndex!: number;
    private switchingActivePokemon !:boolean;
    private team !:Pokemon[];
    private mainPlayer!:Player;
    private opponentData:Pokemon;
    private callResolved: number = 0;
    private OpponentMove!: Attack;
    private opponentTeam!: Pokemon[];
    private playerDamageDealt!:number[];
    private OpponentDamageDealt!:number[];
    private keys:any ;
    private randomIndex !:number; 
    private OPPONENT!:string ;
    private PLAYER = PLAYER_POKEMON_TEAM[0];
    private flag:boolean = false;
    private i:number=0;


    constructor() {
        super("scene2");
    }

    init(){
        this.activePlayerAttackIndex=-1;
        this.switchingActivePokemon = false;
        this.keys =  Object.keys(POKEMON) as Array<keyof typeof POKEMON>;
        this.randomIndex = Math.floor(Math.random() * this.keys.length);
        this.OPPONENT = this.keys[this.randomIndex];
    
    }

    preload() {
        for (const pokemon of Object.values(POKEMON_DATA)) {
            this.load.atlas(`${pokemon.name}`, `src/assets/pokemon/${pokemon.name}_front.png`,`src/assets/pokemon_json/${pokemon.name}_front.json`);
            this.load.atlas(`${pokemon.name}_back`, `src/assets/pokemon/${pokemon.name}_back.png`,`src/assets/pokemon_json/${pokemon.name}_back.json`);

        }
        
        this.load.image("battleScene", "src/assets/images/battle_scene_bg.jpg");
        this.load.atlas(this.OPPONENT, `src/assets/pokemon/${String(this.OPPONENT).toLowerCase()}_front.png`,`src/assets/pokemon_json/${String(this.OPPONENT).toLowerCase()}_front.json`);
        this.load.atlas(this.PLAYER.name, "src/assets/pokemon/pikachu_back.png", "src/assets/pokemon_json/pikachu_back.json");
        this.load.image("healthbar_background", "src/assets/images/hp_bg.png");
        this.load.image(HEALTH_BAR_ASSETS.LEFT_CAP, "src/assets/images/healthbar_left.png");
        this.load.image(HEALTH_BAR_ASSETS.MIDDLE, "src/assets/images/healthbar_mid.png");
        this.load.image(HEALTH_BAR_ASSETS.RIGHT_CAP, "src/assets/images/healthbar_right.png");
        this.load.image(CURSORS.CURSOR, "src/assets/images/cursor.png");
        this.load.image("leftshadow", "src/assets/images/barHorizontal_shadow_left.png");
        this.load.image("midshadow", "src/assets/images/barHorizontal_shadow_mid.png");
        this.load.image("rightshadow", "src/assets/images/barHorizontal_shadow_right.png");
        this.load.image(BATTLE_ASSET_KEYS.POKEBALL, "src/assets/images/pokeBall.png");

        //loading json data
        this.load.json(DATA_ASSET_KEYS.ATTACKS , "src/assets/data/attacks.json");
        //this.load.atlas(POKEMON.SQUIRTLE, `src/assets/pokemon/squirtle_front.png`,`src/assets/pokemon_json/squirtle_front.json`);
    }   

    create(data: { player?: any, opponentTeam?: Pokemon[] }) {
    

        this.mainPlayer=data.player;
        this.team = data.player.getPokemonTeam();
        const firstAlivePokemon = this.team.find(pokemon => pokemon.currentHp > 0);

        if (firstAlivePokemon) {
            this.PLAYER = firstAlivePokemon;
        } else {
            this.PLAYER= this.team[0]
        }


        this.playerDamageDealt=[0,0,0,0,0,0];
        this.OpponentDamageDealt=[0,0,0,0,0,0];

        //battle background 
        const battlebg = new Background(this);
        battlebg.showBackground();
        

        // Loading pokemons 
        this.activePlayerPokemon = new playerPokemon({
            scene: this,
            _pokemonDetails: {
                PokemonId:this.PLAYER.PokemonId,
                name: this.PLAYER.name,
                assetKey: `${this.PLAYER.assetKey}_back`,
                currentHp: this.PLAYER.currentHp,
                maxHp: this.PLAYER.maxHp,
                attackIds: this.PLAYER.attackIds,
                baseAttack: this.PLAYER.baseAttack,
                type: this.PLAYER.type,
                assetFrame: this.PLAYER.assetFrame,
                currentLevel: this.PLAYER.currentLevel,
                experience:this.PLAYER.experience,
                catchRate:this.PLAYER.catchRate,
                evolvesTo:this.PLAYER.evolvesTo,
                evolutionLevel:this.PLAYER.evolutionLevel
            },
        });

        this.activePlayerPokemon.hidePokemon();

        if (data.opponentTeam) {
            console.log("opponent team trainer part")
            this.flag=true;
            this.i++;
            this.opponentTeam = data.opponentTeam;
            this.opponentData = POKEMON_DATA[this.OPPONENT as keyof typeof POKEMON_DATA];
            this.activeOpponentPokemon = new enemyPokemon({
                scene: this,
                _pokemonDetails: {
                    PokemonId: this.opponentData.PokemonId,
                    name: this.OPPONENT,
                    assetKey: this.OPPONENT,
                    assetFrame: this.opponentData.assetFrame,
                    currentHp: this.opponentData.maxHp,
                    maxHp: this.opponentData.maxHp,
                    attackIds: this.opponentData.attackIds,
                    baseAttack: this.opponentData.baseAttack,
                    type: this.opponentData.type,
                    currentLevel: this.opponentData.currentLevel,
                    experience: this.opponentData.experience,
                    catchRate: this.opponentData.catchRate,
                    evolvesTo: this.opponentData.evolvesTo,
                    evolutionLevel: this.opponentData.evolutionLevel
                }
            });
            // this.activeOpponentPokemon.hidePokemon();
        } else {
            console.log("wild pokemon part")
            this.opponentData = POKEMON_DATA[this.OPPONENT as keyof typeof POKEMON_DATA];
            this.opponentTeam = [];
            console.log(this.opponentData);
            this.opponentTeam.push(this.opponentData);
            this.activeOpponentPokemon = new enemyPokemon({
                scene: this,
                _pokemonDetails: {
                    PokemonId: this.opponentData.PokemonId,
                    name: this.OPPONENT,
                    assetKey: this.OPPONENT,
                    assetFrame: this.opponentData.assetFrame,
                    currentHp: this.opponentData.maxHp,
                    maxHp: this.opponentData.maxHp,
                    attackIds: this.opponentData.attackIds,
                    baseAttack: this.opponentData.baseAttack,
                    type: this.opponentData.type,
                    currentLevel: this.opponentData.currentLevel,
                    experience: this.opponentData.experience,
                    catchRate: this.opponentData.catchRate,
                    evolvesTo: this.opponentData.evolvesTo,
                    evolutionLevel: this.opponentData.evolutionLevel
                }
            });
        }

        //battle Machine starts here 
        this.createBattleStateMachine();
        this.battlemenu = new BattleMenu(this, this.activePlayerPokemon, this.activeOpponentPokemon);
        this.controls=new Controls(this);
        if(data.opponentTeam)
            this.battlemenu.hideCatch();
        }

    update(){
        this.battleStateMachine.update();
        
        const wasEnterKeyPressed = this.controls.wasEnterKeyPressed();
        if(wasEnterKeyPressed && (
            this.battleStateMachine.currentStateName===BATTLE_STATES.PRE_BATTLE_INFO||
            this.battleStateMachine.currentStateName===BATTLE_STATES.POST_BATTLE_CHECK||
            this.battleStateMachine.currentStateName===BATTLE_STATES.FLEE_ATTEMPT||
            this.battleStateMachine.currentStateName===BATTLE_STATES.SWITCH_POKEMON||
            this.battleStateMachine.currentStateName===BATTLE_STATES.CATCH_POKEMON )){
            this.battlemenu.playerInput('OK');
            return ;
        }

        if(this.battleStateMachine.currentStateName!== BATTLE_STATES.PLAYER_INPUT){
            return ;
        }

        if (wasEnterKeyPressed) {

            this.battlemenu.playerInput('OK');
            if(this.battlemenu.isAttemptingToSwitchPokemon){
                this.battleStateMachine.setState(BATTLE_STATES.SWITCH_POKEMON);
            }
            if(this.battlemenu.isAttemptingToRun){
                this.battleStateMachine.setState(BATTLE_STATES.FLEE_ATTEMPT);

            }
            if(this.battlemenu.isAttemptingTocatch){
                this.battleStateMachine.setState(BATTLE_STATES.CATCH_POKEMON);
            }

            if (this.battlemenu.selectedAttack === undefined) {
                return;
            }
            this.activePlayerAttackIndex= this.battlemenu.selectedAttack;

            if(!this.activePlayerPokemon.attacks[this.activePlayerAttackIndex]){
                return;
            }
            

            this.battlemenu.HidePokemonAttackMenu();

            this.battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
        }

        if(this.controls.wasShiftKeyPressed()){
            this.battlemenu.playerInput('CANCEL');
            return ;
        }
        
        const selectedDirection = this.controls.getDirectionKeyJustPressed();
        if(selectedDirection !==DIRECTION.NONE){
            this.battlemenu.playerInput(selectedDirection);
        }
    }



    private createBattleStateMachine(){

        this.battleStateMachine = new StateMachine('battle', this);

        this.battleStateMachine.addState({
            name : BATTLE_STATES.INTRO ,   
            onEnter: ()=> {                
                // scene setup / transition 
                this.time.delayedCall(600, ()=>{
                    this.battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO);
                })
            }
        }); 

        // adding pre battle stuff
        this.battleStateMachine.addState({
            name : BATTLE_STATES.PRE_BATTLE_INFO ,
            onEnter: ()=> {
                //wait for enemy monster to this.battleIntroText and notify player 

                // this.opponent pokemon this.battleIntroTexts 
                if(this.flag)
                {
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput([`Trainer chose ${this.activeOpponentPokemon.name}!`],
                        ()=>{
                            this.battleStateMachine.setState(BATTLE_STATES.BRING_OUT_PLAYER);
                            //wait for text animation to complete 
                        }
                    )
                }
                else
                {
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput([`wild ${this.activeOpponentPokemon.name} appeared !`],
                    ()=>{
                        this.battleStateMachine.setState(BATTLE_STATES.BRING_OUT_PLAYER);
                        //wait for text animation to complete 
                    }
                )   
                }            
            }
        })
        
        this.battleStateMachine.addState({
            name : BATTLE_STATES.BRING_OUT_PLAYER ,  
            onEnter: ()=> {
                this.activePlayerPokemon.showPokemon();

                //wait for player monster to this.battleIntroText and notify thhe player
                this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput([`Go ${this.activePlayerPokemon.name }!`],()=>{
                    this.time.delayedCall(5,()=>{
                        if(this.switchingActivePokemon){
                            this.battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
                            return;
                        }
                        this.battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
                    })
                    
                })
            }  
        }); 


        this.battleStateMachine.addState({
            name : BATTLE_STATES.PLAYER_INPUT ,
            onEnter: ()=> {
                this.battlemenu.showMainBattleMenu();
                
                    // this.battleStateMachine.setState(BATTLE_STATES.BATTLE); 
                }});

        this.battleStateMachine.addState({
                    name: BATTLE_STATES.ENEMY_INPUT,
                    onEnter: ()=> {
                        //pick random move or whatever
                        this.battleStateMachine.setState(BATTLE_STATES.BATTLE);
        
                        
                    } 
                });
                
        this.battleStateMachine.addState({
            name : BATTLE_STATES.BATTLE ,
            onEnter: ()=> {
                if(this.battlemenu.isAttemptingToSwitchPokemon){
                    this.time.delayedCall(500, ()=>{
                        this.enemyAttack(() =>{
                            this.switchingActivePokemon = false ; 
                            this.battleStateMachine.setState(BATTLE_STATES.POST_BATTLE_CHECK);  
                        })
                    })
                    return;
                }
                this.playerAttack();
                
            }
        })

        this.battleStateMachine.addState({
            name : BATTLE_STATES.POST_BATTLE_CHECK ,   
            onEnter: ()=> {
                this.postBattleCheck();
                
            } 
        }); 
        this.battleStateMachine.addState({
            name : BATTLE_STATES.FINISHED ,   
            onEnter: ()=> {
                this.transitionNextScene();
            } 
        }); 

        this.battleStateMachine.addState({
            name : BATTLE_STATES.EVOLUTION,   
            onEnter: ()=> {
                this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput([` ${this.activePlayerPokemon.name} is evolving!`,
                    `It evolved into ${this.activePlayerPokemon.evolveTo}!`,],
                    ()=>{
                        
                        this.battleStateMachine.setState(BATTLE_STATES.FINISHED);
                    }
                );
                
                this.activePlayerPokemon.evolvePokemon();
            } 
        }); 

        this.battleStateMachine.addState({
            name : BATTLE_STATES.FLEE_ATTEMPT,
            onEnter: ()=> {

                this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput([`Got away Safely!`],
                    ()=>{
                        this.battleStateMachine.setState(BATTLE_STATES.FINISHED);
                    }
                )
            }
        })

        this.battleStateMachine.addState({
            name : BATTLE_STATES.SWITCH_POKEMON,
            onEnter: ()=> {
                const hasPokemon = this.team.some((pokemonInTeam)=>{
                    return (
                        pokemonInTeam.PokemonId!== this.PLAYER.PokemonId && pokemonInTeam.currentHp >0
                    )
                });

                if(!hasPokemon){
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(["No Other Pokemon.."], ()=>{
                        this.battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
                    })
                    return;
                }
                console.log("in battle scene ", this.team);
                this.scene.launch("scene3", {battle:this, player: this.mainPlayer, activepokemon : this.PLAYER });
                this.events.once("pokemonSwitched", (newPokemon:Pokemon)=>{
                    this.switchToPokemon(newPokemon);
                })
                this.events.once("switchCanceled", () => {
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(["Switch Pokemon Canceled"], () => {
                        this.battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
                    });
                });
                
            }
        })
        this.battleStateMachine.addState({
            name : BATTLE_STATES.CATCH_POKEMON ,   
            onEnter: () => {
                const catchProbability = this.calculateCatchProbability(this.activeOpponentPokemon);
            
                if (Math.random() < catchProbability) {
                    // Get current team from DataManager
                    const playerTeam = dataManager.getPlayerTeam();
            
                    // Check if team is not full (assuming max 6 Pokémon in a team)
                    if (playerTeam.length < 6) {
                        this.opponentData.currentHp=this.activeOpponentPokemon.currentHealth;
                        // Add new Pokémon to the team
                        
                        playerTeam.push(this.opponentData); 

                        dataManager.updatePlayerTeam(playerTeam);
                    } else {
                        this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                            ["Team is Full"],
                            () => {
                                // End battle scene
                                this.transitionNextScene();
                            }
                        );        }
            
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                        [`Caught ${this.activeOpponentPokemon.name}!`],
                        () => {
                            // End battle scene
                            this.transitionNextScene();
                        }
                    );
                } else {
                    // Pokémon flees
                    this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                        [`${this.activeOpponentPokemon.name} broke free and fled!`],
                        () => {
                            // End battle scene
                            this.transitionNextScene();
                        }
                    );
                }
            }
        }); 
        //start state machine
        this.battleStateMachine.setState('INTRO')
    }

    private switchToPokemon(newPokemon:Pokemon){
        this.PLAYER = newPokemon;
        this.activePlayerPokemon.hidePokemon();
        this.activePlayerPokemon= new playerPokemon({
            scene: this,
            _pokemonDetails: this.PLAYER
        })
        this.battlemenu.updatePlayerPokemon(this.activePlayerPokemon);
        this.battlemenu.updatePokemonAttackSubMenu();
        this.battlemenu.showMainBattleMenu();
        
        this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
            [`Player switched to ${this.activePlayerPokemon.name}!`],
            ()=>{  
                    this.battleStateMachine.setState(BATTLE_STATES.BRING_OUT_PLAYER);
    
            
                })
    }
    
    private playerAttack() {
        const selectedAttack = this.activePlayerPokemon.attacks[this.activePlayerAttackIndex];
    
        this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput(
            [`${this.activePlayerPokemon.name} used ${selectedAttack.name}`],
            () => {
                this.time.delayedCall(1200, () => {
                    // Get the attack type from the attacks data
                    const attackData = this.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
                    const attackType = attackData.find((attack: any) => attack.id === selectedAttack.id)?.type || "NORMAL";
    
                    // Call takeDamage and get the effectiveness result
                    const currentOpponentHp=this.activeOpponentPokemon.currentHealth
                    const result = this.activeOpponentPokemon.takeDamage(
                        this.activePlayerPokemon.baseAttack,
                        attackType
                    );
                    let i=0;

                    this.opponentTeam.forEach((pokemon,index)=>{
                        if(pokemon.PokemonId===this.activeOpponentPokemon.pokemonID){
                                    i=index;
                        }
                        })
                    this.OpponentDamageDealt[i]= currentOpponentHp-this.activeOpponentPokemon.currentHealth
                    console.log("opponent Pokemon",this.activeOpponentPokemon.name , i , currentOpponentHp-this.activeOpponentPokemon.currentHealth )
                    const effectiveness= result[0];
            
                    
    
                    // Prepare effectiveness message
                    let effectivenessMessage = "";
                    if (effectiveness >1) {
                        effectivenessMessage = "It's super effective!";
                    } else if (effectiveness<1) {
                        effectivenessMessage = "It's not very effective...";
                    }
    
                    // Show effectiveness message if applicable, then proceed
                    if (effectivenessMessage) {
                        this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput(
                            [effectivenessMessage],
                            () => this.enemyAttack()
                        );
                    } else {
                        this.enemyAttack(); // No extra message, just continue
                    }
                });
            }
        );
    }
    

    
    

    private enemyAttack(onComplete?: () => void) {
        // this.activeOpponentPokemon.hidePokemon();
        if (this.activeOpponentPokemon.isFainted) {
           
            this.battleStateMachine.setState(BATTLE_STATES.POST_BATTLE_CHECK);
            if (onComplete) onComplete();
            return;
      }
        if (this.battlemenu.isAttemptingToSwitchPokemon) {
            console.log("Skipping enemy attack due to Pokémon switch.");
            if (onComplete) onComplete();
            return;
        }
        // console.log(this.opponentTeam);
        if(this.callResolved === 0) {
            //call the api to get the mode's move
            this.callResolved = 1;

            this.fetchOpponentMove(this.team,this.opponentTeam)
            .then((res)=> {

                this.OpponentMove= this.activeOpponentPokemon.attacks[res.moveIndex];
                console.log("rad this", res.moveIndex);
                console.log(this.OpponentMove);
            })
            .catch((err)=> {
                console.log(err);
                this.OpponentMove= this.randomMove();
            })
            .finally(()=> {
                this.callResolved = 0;
                const attackData = this.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
                const attackType = attackData.find((attack: any) => attack.id === this.OpponentMove.id)?.type || "NORMAL";
                const currentHp=this.activePlayerPokemon.currentHealth;
                this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput(
                    [`${this.activeOpponentPokemon.name} used ${this.OpponentMove.name}`],
                    () => {
                        this.time.delayedCall(1200, () => {
                            // Call takeDamage and get the effectiveness result
                            const result = this.activePlayerPokemon.takeDamage(
                                this.activeOpponentPokemon.baseAttack,
                                attackType,
                                () => {
                                    this.battleStateMachine.setState(BATTLE_STATES.POST_BATTLE_CHECK);
                                    if (onComplete) onComplete();
                                }
                            ); 
                            let i=0;
                            
                            this.team.forEach((pokemon,index)=>{
                                if(pokemon.PokemonId===this.activePlayerPokemon.pokemonID){
                                    i=index;
                                }
                            })
                            this.playerDamageDealt[i]= currentHp-this.activePlayerPokemon.currentHealth;
                            console.log("player Pokemon ",this.activePlayerPokemon.name , i , currentHp-this.activePlayerPokemon.currentHealth )
                            const effectiveness= result[0];
                            this.opponentData.currentHp=this.activeOpponentPokemon.currentHealth;
                            const playerTeam = dataManager.getPlayerTeam();
                    const index = playerTeam.findIndex(p => p.name === this.activePlayerPokemon.name);
                    
                    if (index !== -1) {
                        dataManager.updatePokemonHP(index, this.activePlayerPokemon.currentHealth);
                    }
                
                            
                            
        
                            // Prepare effectiveness message
                            let effectivenessMessage = "";
                            if (effectiveness > 1) {
                                effectivenessMessage = "It's super effective!";
                            } else if (effectiveness < 1) {
                                effectivenessMessage = "It's not very effective...";
                            }
                            if (effectivenessMessage) {
                                this.battlemenu.updateInfoPaneMsgsWithoutPlayerInput(
                                    [effectivenessMessage],
                                    () => {
                                        this.battleStateMachine.setState(BATTLE_STATES.POST_BATTLE_CHECK);
                                        if (onComplete) onComplete();
                                    }
                                );
                            } else {
                                this.battleStateMachine.setState(BATTLE_STATES.POST_BATTLE_CHECK);
                                if (onComplete) onComplete();
                            }
                        });
                    }
        );
        })
    } 
}

    private calculateExperienceGained(opponentPokemon: BattlePokemon): number {
        // Example formula for experience gain
        const experienceGained = Math.floor(opponentPokemon.level * 1000);
        return experienceGained;
    }

private postBattleCheck() {
    if (this.activeOpponentPokemon.isFainted) {
        const experienceGained = this.calculateExperienceGained(this.activeOpponentPokemon);
        const prevlevel=this.activePlayerPokemon.level;
        this.activePlayerPokemon.addExperience(experienceGained);
    
        if (this.activePlayerPokemon.level > prevlevel) {
            if(this.activePlayerPokemon.level>= this.activePlayerPokemon.evolutionLevel){
            this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
            [
                `Wild ${this.activeOpponentPokemon.name} Fainted `,
                `${this.activePlayerPokemon.name} gained Experience`,
                `${this.activePlayerPokemon.name} leveled up to level ${this.activePlayerPokemon.level}!`,
                
            ],
                () => {
                    this.battleStateMachine.setState(BATTLE_STATES.EVOLUTION);
                }
            );
        }
        else
            {
                this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                    [
                        `Wild ${this.activeOpponentPokemon.name} Fainted `,
                        `${this.activePlayerPokemon.name} gained Experience`,
                        `${this.activePlayerPokemon.name} leveled up to level ${this.activePlayerPokemon.level}!`,
                        
                    ],
                        () => {
                            this.battleStateMachine.setState(BATTLE_STATES.FINISHED);
                        }
                    );
            }
        } else {
        this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
            [` ${this.activeOpponentPokemon.name} Fainted `, `${this.activePlayerPokemon.name} gained Experience`],
            () => {
                this.battleStateMachine.setState(BATTLE_STATES.FINISHED);
            }
        );
        }
        return;
    }

    if (this.activePlayerPokemon.isFainted) {
        const hasPokemon = this.team.some((pokemonInTeam)=>{
            return (
                pokemonInTeam.PokemonId!== this.PLAYER.PokemonId && pokemonInTeam.currentHp >0
            )
        })

        if (hasPokemon) {
            // Go to Switch Pokémon state
            this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                [`${this.activePlayerPokemon.name} Fainted.`,` Choose another Pokémon!`],
                () => {
                    this.battleStateMachine.setState(BATTLE_STATES.SWITCH_POKEMON);
                }
            );
        } else {
            // No Pokémon left, player loses the battle
            this.battlemenu.updateInfoPaneMsgsWaitForPlayerInput(
                [`${this.activePlayerPokemon.name} Fainted`, "You ran to safety!"],
                () => {
                    this.battleStateMachine.setState(BATTLE_STATES.FINISHED);
                }
            );
        }
        return;
    }

    this.battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
}

    private transitionNextScene(){
        this.cameras.main.fadeOut(2600,0 ,0 ,0) ;
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
            this.scene.start("scene4");
        })
    }


    
    private calculateCatchProbability(pokemon: BattlePokemon): number {
        const levelFactor = 1 - (pokemon.level / 100); // Adjust this formula as needed
        const hpFactor = 1 - (pokemon.currentHealth / pokemon.maxHealth);
        const catchProbability = (levelFactor + hpFactor) / 2; // Adjust this formula as needed
    
        return catchProbability;
    }


    private randomMove() {
        const randomIndex = Math.floor(Math.random() * this.activeOpponentPokemon.attacks.length);
        return this.activeOpponentPokemon.attacks[randomIndex];
    }
    
    async fetchOpponentMove(team1: Pokemon[], team2: Pokemon[]) {
        const MoveData = this.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
        
        console.log("team1", team1, "Type:", typeof team1);
        console.log("team2", team2, "Type:", typeof team2);
        console.log("MoveData", MoveData, "Type:", typeof MoveData);
        console.log("playerDamage", this.playerDamageDealt, "Type:", typeof this.playerDamageDealt);
        console.log("opponentDamage", this.OpponentDamageDealt, "Type:", typeof this.OpponentDamageDealt);
    
        try {
            const url = "http://127.0.0.1:5000/fetchOpponentMove";
    
            const payload = {
                team1: team1,
                team2: team2,
                MoveData: MoveData,
                PlayerDamage: this.playerDamageDealt,
                OpponentDamage: this.OpponentDamageDealt
            };
    
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            return await response.json();
        } catch (error) {
            console.error("Error fetching opponent move:", error);
            return null;
        }
    }
    
}
