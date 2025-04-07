import Phaser from "phaser";
import { Direction, DIRECTION } from "./direction";
import { Pokemon } from "./typedef";
import { PLAYER_POKEMON_TEAM } from "./player-pokemon-list";
const TILE_SIZE=64;


interface Position {
    x: number;
    y: number;
}

interface Player {
    position: Position;
    direction: Direction;
    team: Pokemon[];
}

interface GlobalState {
    player: Player;
}


const initialState:GlobalState={
    player:{
        position:{
            x:6*TILE_SIZE,
            y:21*TILE_SIZE

        },
        direction: DIRECTION.DOWN,
        team:PLAYER_POKEMON_TEAM
    }

}

export const DATA_MANAGER_KEYS = Object.freeze({
    PLAYER_POSTION: 'PLAYER_POSTION',
    PLAYER_DIRECTION: 'PLAYER_DIRECTION',
    PLAYER_TEAM: 'PLAYER_TEAM'
})
class DataManager extends Phaser.Events.EventEmitter{
    private store: Phaser.Data.DataManager
    constructor(){
        super();
        this.store= new Phaser.Data.DataManager(this);
        this.updateDataManager(initialState);
    }
    updateDataManager(data:GlobalState){
        this.store.set({
            [DATA_MANAGER_KEYS.PLAYER_POSTION]:data.player.position,
            [DATA_MANAGER_KEYS.PLAYER_DIRECTION]:data.player.direction,           
            [DATA_MANAGER_KEYS.PLAYER_TEAM]:data.player.team 
        })
    }

    get storeData(){
        return this.store;
    }
    getPlayerTeam(): Pokemon[] {
        return this.store.get(DATA_MANAGER_KEYS.PLAYER_TEAM) || [];
    }
    updatePlayerTeam(newTeam: Pokemon[]) {
        this.store.set(DATA_MANAGER_KEYS.PLAYER_TEAM, newTeam);
    }
    updatePokemonHP(index: number, newHp: number) {
        let team = this.getPlayerTeam();
        if (team[index]) {
            team[index].currentHp = Math.max(0, Math.min(newHp, team[index].maxHp));
            this.updatePlayerTeam(team);
        }
    }
    
    updatePokemonExperience(index: number, newExperience: number, newLevel: number) {
            let team = this.getPlayerTeam();
        
            if (team[index]) {
              team[index].experience = newExperience;
              team[index].currentLevel = newLevel;
              this.updatePlayerTeam(team);
            }
          }
          replacePokemon(index : number, pokemondetails: Pokemon)
          {
                let team=this.getPlayerTeam();
                team[index].PokemonId=pokemondetails.PokemonId;
                team[index].assetFrame=pokemondetails.assetFrame;
                team[index].assetKey=pokemondetails.assetKey;
                team[index].attackIds=pokemondetails.attackIds;
                team[index].baseAttack=pokemondetails.baseAttack;
                team[index].catchRate=pokemondetails.catchRate;
                team[index].currentHp=pokemondetails.currentHp;
                team[index].currentLevel=pokemondetails.currentLevel;
                team[index].evolutionLevel=pokemondetails.evolutionLevel;
                team[index].evolvesTo=pokemondetails.evolvesTo;
                team[index].experience=pokemondetails.experience;
                team[index].maxHp=pokemondetails.maxHp;
                team[index].name=pokemondetails.name;
                team[index].spriteKeyBack=pokemondetails.spriteKeyBack;
                team[index].spriteKeyFront=pokemondetails.spriteKeyFront;
                team[index].type=pokemondetails.type;
                team[index].level=pokemondetails.level;
          }
    }



export const dataManager = new DataManager();
