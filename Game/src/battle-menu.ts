import Phaser from "phaser";

import { DIRECTION, Direction } from "./direction";

import { CURSORS } from "./asset_keys";

import { BattlePokemon } from "./battle-pokemon";

const Style = {
  fontSize: "20px",
  color: "#fff",
};

const BATTLE_MENU_OPTIONS = Object.freeze({
  FIGHT: 'FIGHT',
  RUN: 'RUN',
  SWITCH: 'SWITCH',
  CATCH: 'CATCH'
} as const)

export type BattleOptions = keyof typeof BATTLE_MENU_OPTIONS;

const ACTIVE_BATTLE_MENU = Object.freeze({
  BATTLE_MAIN: 'BATTLE_MAIN',
  BATTLE_MOVE_SELECT: 'BATTLE_MOVE_SELECT',
  FIGHT: 'FIGHT',
  RUN: 'RUN',
  SWITCH: 'SWITCH',
  CATCH: 'CATCH'
} as const);

type ActiveBattleMenu = keyof typeof ACTIVE_BATTLE_MENU;

const MOVES_LIST = Object.freeze({
  MOVE_1: 'MOVE_1',
  MOVE_2: 'MOVE_2',
  MOVE_3: 'MOVE_3',
  MOVE_4: 'MOVE_4',
});

type MoveList = keyof typeof MOVES_LIST;

export class BattleMenu {
  private scene: Phaser.Scene;
  private PlayerOptions!: Phaser.GameObjects.Container;
  private MainMenu!: Phaser.GameObjects.Container;
  private cursorObject!: Phaser.GameObjects.Image;
  private textLine1!: Phaser.GameObjects.Text;
  private selectedBattleMenuOption: BattleOptions; // this is for the player options like Fight Run Switch
  private attackCursorObject!: Phaser.GameObjects.Image;
  private InfoPanelMessages: string[];
  private InfoPanelCallBack?: () => void;
  private WaitForPlayerInput: boolean;
  private SelectedAttackIndex: number | undefined;
  private activeBattleMenu: ActiveBattleMenu;
  private selectedMove: MoveList;
  private PokemonAttackList!: Phaser.GameObjects.Container;
  private activePlayerPokemon!: BattlePokemon;
  private activeOpponentPokemon!: BattlePokemon; // Added property
  private userInputCursor!: Phaser.GameObjects.Image;
  private unserInputCursorTween!: Phaser.Tweens.Tween;
  private switchPokemon!: boolean;
  private runattempt!: boolean;
  private catchAttempt!: boolean;
  private catchText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, activePlayerPokemon: BattlePokemon, activeOpponentPokemon: BattlePokemon) {
    this.scene = scene;
    this.activePlayerPokemon = activePlayerPokemon;
    this.activeOpponentPokemon = activeOpponentPokemon; // Initialize activeOpponentPokemon

    this.createMainInfoPane();
    this.createMainBattleMenu();
    this.PokemonAttackSubMenu();
    this.HidePokemonAttackMenu();
    this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
    this.InfoPanelCallBack = undefined;
    this.InfoPanelMessages = [];
    this.WaitForPlayerInput = false;
    this.SelectedAttackIndex = undefined
    this.activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.selectedMove = MOVES_LIST.MOVE_1;
    this.createPlayerInputCursor();
    this.switchPokemon = false;
    this.runattempt = false
    this.catchAttempt=false;
  }

  // Method to handle catch attempt
  catchPokemonAttempt() {
    
   
  }

  // Method to calculate catch probability based on level and HP
 
  // Modify chooseMainBattleOption to handle catch attempt
  private chooseMainBattleOption() {
    // console.log(this.activeBattleMenu);

    this.hideMainBattleMenu();

    if (this.activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
      if (this.selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
        // this.hideMainBattleMenu();
        this.ShowPokemonAttackMenu();
        this.addText();
        // console.log(this.activeBattleMenu);
        return;
      }

      if (this.selectedBattleMenuOption === BATTLE_MENU_OPTIONS.RUN) {
        // console.log(this.selectedBattleMenuOption);
        this.activeBattleMenu = ACTIVE_BATTLE_MENU.RUN;
        this.runattempt = true;
        return;
      }

      if (this.selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
        // console.log(this.selectedBattleMenuOption);
        this.activeBattleMenu = ACTIVE_BATTLE_MENU.SWITCH;
        this.switchPokemon = true;
        return;
      }

      if (this.selectedBattleMenuOption === BATTLE_MENU_OPTIONS.CATCH) {
        this.catchAttempt=true;
        this.catchPokemonAttempt();
        return;
      }
    }
  }

    //returns the attack index 0 ,1,2,3 
    get selectedAttack(){
        if(this.activeBattleMenu ===ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT)
            return this.SelectedAttackIndex;
        return  ;
    }
    get BattleMenuOption(){
        return this.selectedBattleMenuOption;
    }
    get isAttemptingTocatch(){
        return this.catchAttempt;
    }

    get isAttemptingToSwitchPokemon (){
        return this.switchPokemon;

    }
    get isAttemptingToRun (){
        return this.runattempt;

    }

    updatePokemonAttackSubMenu() {
        const attackNames: string[] = [];
      
        for (let i = 0; i < 4; i += 1) {
          attackNames.push(this.activePlayerPokemon.attacks[i]?.name || "-");
        }
      
        const texts = this.PokemonAttackList.list.filter(obj => obj instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[];
      
        if (texts.length >= 4) {
          texts[0].setText(attackNames[0]);
          texts[1].setText(attackNames[1]);
          texts[2].setText(attackNames[2]);
          texts[3].setText(attackNames[3]);
        }
      }
    //To show the initial Info Pane about pokemon appearing and player options 
    showMainBattleMenu(){
        this.activeBattleMenu =ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.MainMenu.setAlpha(1);
        //setting default to FIGHT so the the cursor is there 
        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
        this.cursorObject.setPosition(60,45)
        this.SelectedAttackIndex=undefined
        //this is the pokemon attacks Menu 
        this.HidePokemonAttackMenu();
        this.PlayerOptions.setAlpha(1);
        this.switchPokemon=false;
        this.runattempt=false;
        this.catchAttempt=false;


    }

    //To hide the main Info Pane
    hideMainBattleMenu(){
        this.MainMenu.setAlpha(0); 
        this.PlayerOptions.setAlpha(0);
    }
    

    // this is Pokemon Attcks Part 
    ShowPokemonAttackMenu(){
        this.activeBattleMenu =ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
        this.PokemonAttackList.setAlpha(1);
        this.PlayerOptions.setAlpha(0);
    }

    HidePokemonAttackMenu(){
        this.activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
        this.PokemonAttackList.setAlpha(0);
        this.PlayerOptions.setAlpha(1);
    }

    playerInputCursorAnimation(){
        this.userInputCursor.setPosition(
            this.textLine1.displayWidth+ this.userInputCursor.displayWidth * 2.7,
            this.userInputCursor.y
        )
        this.userInputCursor.setAlpha(1);
        this.unserInputCursorTween.restart();


    }
    hideInputCursor(){
        this.userInputCursor.setAlpha(0);
        this.unserInputCursorTween.pause();
    }

    






    playerInput(input: 'OK' | 'CANCEL' |Direction  ){

        if(this.WaitForPlayerInput && (input === 'CANCEL' ||input==='OK')){
            this.updateInfoPaneWithMessage();
            return;
        }

        if (input === 'CANCEL'){
            this.SwitchToMainBattleMenu();
            return ; }

        if(input ==='OK'){  
            
            if(this.activeBattleMenu=== ACTIVE_BATTLE_MENU.BATTLE_MAIN){
                this.chooseMainBattleOption();                
                return
            }
            
            if(this.activeBattleMenu=== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
                this.ChosenAttack();
                return
            }
            return;
        }
        this.updateSelectedBattleMenuOptions(input);
        this.updatePokemonAttackOptions(input);
        this.updateCursorPosition();
        this.updateAttackCursorPosition();

        
    }

    updateInfoPaneMsgsWithoutPlayerInput(messages: string[], callback?: () => void) {
        let index = 0;
    
        const showNextMessage = () => {
            if (index < messages.length) {
                this.textLine1.setText('').setAlpha(1);
                this.textLine1.setText(messages[index]);
                index++;
    
                // Use setTimeout instead of this.time.delayedCall
                setTimeout(showNextMessage, 1000); // 1-second delay (adjust as needed)
            } else if (callback) {
                callback();
            }
        };
    
        showNextMessage();
    }

    // This is for messages in the Player options  
    updateInfoPaneMsgsWaitForPlayerInput(messages: string[], callback?: ()=>void ){
        this.InfoPanelMessages=messages;
        this.InfoPanelCallBack=callback;
        this.updateInfoPaneWithMessage();

    }

    // This is for Displaing the Msgs 
    private updateInfoPaneWithMessage(){
        this.WaitForPlayerInput= false;
        this.addText();
        this.hideInputCursor();

        if(this.InfoPanelMessages.length===0){
            if(this.InfoPanelCallBack){
                
                const callback = this.InfoPanelCallBack;
                this.InfoPanelCallBack = undefined
                callback();
            }
            return;
        }

        const msgToDisplay: string = this.InfoPanelMessages.shift() ?? "Default message";
        this.addText(msgToDisplay)
        this.WaitForPlayerInput = true;
        this.playerInputCursorAnimation();

    }

    private createMainBattleMenu(){
        this.MainMenu =  this.scene.add.container(0,390,[]) ;
        
        this.cursorObject = this.scene.add.image(60, 45, CURSORS.CURSOR , 0).setOrigin(0.5).setScale(2.5)

        
        this.PlayerOptions = this.scene.add.container(500,395,[            
            this.createMainInfoSubPane(),
            this.scene.add.text(70,35 , BATTLE_MENU_OPTIONS.FIGHT, Style),
            this.scene.add.text(230,35 , BATTLE_MENU_OPTIONS.RUN, Style),
            this.scene.add.text(70,90 , BATTLE_MENU_OPTIONS.SWITCH, Style ),
            this.catchText = this.scene.add.text(230,90 , BATTLE_MENU_OPTIONS.CATCH, Style ),
            this.cursorObject,
        ])        
        this.hideMainBattleMenu();
        
    }
    
    hideCatch() {
        this.catchText.setAlpha(0);
    }
    

    private PokemonAttackSubMenu(){

        const attackNames :string[] = [];
        for (let i = 0 ; i<4; i+=1){
            attackNames.push(this.activePlayerPokemon.attacks[i]?.name|| "-");
        }



        this.attackCursorObject = this.scene.add.image(60, 45 , CURSORS.CURSOR, 0 ).setOrigin(0.5).setScale(2.5);
        this.PokemonAttackList =  this.scene.add.container(0,395, [
            this.scene.add.text(70,35 , attackNames[0], Style),
            this.scene.add.text(290,35 , attackNames[1], Style),
            this.scene.add.text(70,90 ,attackNames[2], Style ),
            this.scene.add.text(290,90 , attackNames[3], Style ),
            this.attackCursorObject
        ])

        this.HidePokemonAttackMenu();
    }


    private createMainInfoPane(){
        const padding = 4 
        const rectheight = 142
        return this.scene.add.rectangle(0, this.scene.scale.height - rectheight -padding, this.scene.scale.width ,rectheight, 0x000000)
        .setOrigin(0)
        .setStrokeStyle(8,0xffff77,1)
    }

    //ui stuff for the side menu
    private createMainInfoSubPane(){
        
        const rectheight = 142
        const rectwidth=460
        return this.scene.add.rectangle(0,0,rectwidth,rectheight, 0x000000)
        .setOrigin(0)
        .setStrokeStyle(8,0xffff77,1)

    }


    private updateSelectedBattleMenuOptions(direction: Direction) {
        const currentOption = this.selectedBattleMenuOption;
    
        if (this.activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
            if (currentOption === BATTLE_MENU_OPTIONS.FIGHT) {
                if (direction === DIRECTION.RIGHT) {
                    if (this.catchText.alpha === 0) { // If Catch is hidden, skip it
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                    } else {
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.RUN;
                    }
                } else if (direction === DIRECTION.DOWN) {
                    this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                }
            } else if (currentOption === BATTLE_MENU_OPTIONS.RUN) {
                if (direction === DIRECTION.DOWN) {
                    if (this.catchText.alpha === 0) { // If Catch is hidden, skip it
                        // Handle skipping or another action
                    } else {
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.CATCH;
                    }
                } else if (direction === DIRECTION.LEFT) {
                    this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
                }
            } else if (currentOption === BATTLE_MENU_OPTIONS.SWITCH) {
                if (direction === DIRECTION.RIGHT) {
                    if (this.catchText.alpha === 0) { // If Catch is hidden, skip it
                        // Handle skipping or another action
                    } else {
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.CATCH;
                    }
                } else if (direction === DIRECTION.UP) {
                    this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
                }
            } else if (currentOption === BATTLE_MENU_OPTIONS.CATCH) {
                if (this.catchText.alpha === 0) { // If Catch is hidden, skip it
                    // Handle skipping or another action
                } else {
                    if (direction === DIRECTION.UP) {
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.RUN;
                    } else if (direction === DIRECTION.LEFT) {
                        this.selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
                    }
                }
            }
            this.updateCursorPosition();
        }
    
    

        // Update cursor position
    }

    private updateCursorPosition() {
        switch (this.selectedBattleMenuOption) {
            case BATTLE_MENU_OPTIONS.FIGHT:
                this.cursorObject.setPosition(60, 45);
                break;
            case BATTLE_MENU_OPTIONS.RUN:
                this.cursorObject.setPosition(220, 45);
                break;
            case BATTLE_MENU_OPTIONS.SWITCH:
                this.cursorObject.setPosition(60, 97);
                break;
                case BATTLE_MENU_OPTIONS.CATCH:
                    this.cursorObject.setPosition(220, 97);
                    break;
            default:
                console.warn("Unknown menu option:", this.selectedBattleMenuOption);
                break;
        }
    }

    private updatePokemonAttackOptions(direction:Direction){
        
        if (this.activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {

            return;
        }
        
        if(this.selectedMove=== MOVES_LIST.MOVE_1){
            
            switch (direction){
                case DIRECTION.RIGHT:
                    this.selectedMove= MOVES_LIST.MOVE_2
                    break ;
                case DIRECTION.LEFT:
                    return ;
                case DIRECTION.DOWN:
                    this.selectedMove= MOVES_LIST.MOVE_3
                    break ;
                case DIRECTION.UP:
                    return ;
                default:
                    return ; 
            }
        }
        else if(this.selectedMove=== MOVES_LIST.MOVE_2){
            switch (direction){
                case DIRECTION.RIGHT:
                    return ;
                case DIRECTION.LEFT:
                    this.selectedMove= MOVES_LIST.MOVE_1
                    break ;
                case DIRECTION.DOWN:
                    this.selectedMove= MOVES_LIST.MOVE_4
                    break ;
                case DIRECTION.UP:
                    return ;
                default:
                    return ; 
            }

        }
        else if(this.selectedMove=== MOVES_LIST.MOVE_3){
            switch (direction){
                case DIRECTION.RIGHT:
                    this.selectedMove= MOVES_LIST.MOVE_4
                    break ;
                case DIRECTION.LEFT:
                    return ;
                case DIRECTION.DOWN:
                    return ;
                case DIRECTION.UP:
                    this.selectedMove= MOVES_LIST.MOVE_1
                    break ;
                default:
                    return; 
            }

        }
        else if(this.selectedMove=== MOVES_LIST.MOVE_4){
            switch (direction){
                case DIRECTION.RIGHT:
                    
                    break; ;
                case DIRECTION.LEFT:
                    this.selectedMove= MOVES_LIST.MOVE_3
                    break ;
                case DIRECTION.DOWN:
                    
                    return;  
                case DIRECTION.UP:
                    this.selectedMove= MOVES_LIST.MOVE_2
                    break;
                default:
                    return ; 
            }


        }
    
    return;
    
}




    private updateAttackCursorPosition(){
        if(this.activeBattleMenu !==ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT){
            return ;

        }

        switch(this.selectedMove){
            case MOVES_LIST.MOVE_1:
                this.attackCursorObject.setPosition(65,45);
                return;
            case MOVES_LIST.MOVE_2:
                this.attackCursorObject.setPosition(280,45);
                return;
            case MOVES_LIST.MOVE_3:
                this.attackCursorObject.setPosition(65,100);
                return;
            case MOVES_LIST.MOVE_4:
                this.attackCursorObject.setPosition(280,100);
                return;
        }

    }
    



    private SwitchToMainBattleMenu(){
        this.WaitForPlayerInput=false;
        this.hideInputCursor();
        this.HidePokemonAttackMenu();
        this.showMainBattleMenu();
        this.addText();
    }
    private ChosenAttack(){
        
        this.activeBattleMenu=ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
        // console.log(this.activeBattleMenu);
        let SelectedAttackIndex =0 ;
        switch(this.selectedMove){
            case MOVES_LIST.MOVE_1:
                SelectedAttackIndex =0
                break;
            case MOVES_LIST.MOVE_2:
                SelectedAttackIndex =1
                break;
            case MOVES_LIST.MOVE_3:
                SelectedAttackIndex =2
                break;
            case MOVES_LIST.MOVE_4:
                SelectedAttackIndex =3
                break;
            default:
                return

        }
        this.SelectedAttackIndex = SelectedAttackIndex
        // console.log(this.SelectedAttackIndex);

    }

    private addText(msg? : string ){
        if(!this.textLine1){
            this.textLine1 = this.scene.add.text(50, 450, "",{ fontSize: "20px",
                color: "#fff",
            })
        }
        if(msg){
            this.textLine1.setText(msg);
        }else{
            this.textLine1.setText("");
        }

    }



    private createPlayerInputCursor(){
        this.userInputCursor=this.scene.add.image(0,0, CURSORS.CURSOR );
        this.userInputCursor.setAngle(90).setScale(3.5,2);
        this.userInputCursor.setAlpha(0);

        this.unserInputCursorTween= this.scene.add.tween({
            delay : 0 ,
            duration:500,
            repeat: -1 ,
            y:{
                from : 460,
                start : 460 ,
                to : 466,
            },
            targets: this.userInputCursor,
        });
        this.unserInputCursorTween.pause();
    }

    updatePlayerPokemon(newPokemon: BattlePokemon) {
        // Update the player's Pokémon reference
        this.activePlayerPokemon = newPokemon;       
    return;
    }
    
    updateOpponentPokemon(newPokemon: BattlePokemon) {
        // Update the player's Pokémon reference
        this.activeOpponentPokemon = newPokemon;       
    return;
    }

}
