import { Direction, DIRECTION } from "../direction";
import { getTargetPostionFromGameObjectPositionAndDirection } from "../grid-utils";
import { Coordinate } from "../typedef";


export interface CharacterConfig {
    scene: Phaser.Scene;
    assetKey: string;
    assetFrame?: number; // Defaults to 0 if not provided
    position: Coordinate;
    direction:Direction;
    spriteGridMovementFinishedCallBack?:()=>void;
    collisionLayer ?:Phaser.Tilemaps.TilemapLayer;
}


export class Character{
    protected scene!:Phaser.Scene;
    protected phaserGameObject !: Phaser.GameObjects.Sprite;
    protected direction!:Direction;
    protected isMoving!: boolean;
    protected targetPosition!:Coordinate
    protected previousTargetPositon!:Coordinate
    protected spriteGridMovementFinishedCallBack?:()=>void;
    protected collisionLayer ?:Phaser.Tilemaps.TilemapLayer;
    


    constructor(config:CharacterConfig){
        this.scene= config.scene;
        this.direction=config.direction;
        this.isMoving= false;
        this.targetPosition={...config.position};
        this.previousTargetPositon={...config.position};
        this.phaserGameObject= this.scene.add.sprite(config.position.x, config.position.y,config.assetKey,config.assetFrame||0).setOrigin(0);
        this.phaserGameObject.setScale(4)
        this.spriteGridMovementFinishedCallBack=config.spriteGridMovementFinishedCallBack;
        this.collisionLayer=config.collisionLayer
    }

    get sprite(){
        return this.phaserGameObject;
    }
    get isMovingGetter():boolean{
        return this.isMoving;
    }

    get directionGetter():Direction{
        return this.direction;
    }

    moveCharacter(direction:Direction){
        this.direction=direction
        

        if(this.isMoving){
            return;
        }
        
        switch (this.direction) {
            case DIRECTION.UP:
                this.phaserGameObject.anims.play("PLAYER_UP", true);
                break;
            case DIRECTION.DOWN:
                this.phaserGameObject.anims.play("PLAYER_DOWN", true);
                break;
            case DIRECTION.LEFT:
                this.phaserGameObject.anims.play("PLAYER_LEFT", true);
                break;
            case DIRECTION.RIGHT:
                this.phaserGameObject.anims.play("PLAYER_RIGHT", true);
                break;
            default:
                this.phaserGameObject.anims.stop();
                break;
        }
        this.movesprite();

    }

    update(time:DOMHighResTimeStamp){
        if(this.isMoving){
            return;
        }
        
        this.phaserGameObject.anims.stop();}

    movesprite(){
        
        
    
        if(this.isBlockingTile()){
            return;
        }
        
        this.isMoving=true;
        this.handleSpriteMovement();


    }
    handleSpriteMovement(){
        

        if (this.direction === DIRECTION.NONE) {
            return;
        }
        

        const updatedPosition = getTargetPostionFromGameObjectPositionAndDirection(this.targetPosition,this.direction)
        this.previousTargetPositon={...this.targetPosition};
        this.targetPosition.x=updatedPosition.x;
        this.targetPosition.y=updatedPosition.y;

        this.scene.add.tween({
            delay:0,
            duration:100,
            y:this.targetPosition.y,
            x:this.targetPosition.x,
            targets:this.phaserGameObject,
            onComplete:()=>{
                this.isMoving=false;
                this.previousTargetPositon={...this.targetPosition};
                if(this.spriteGridMovementFinishedCallBack){
                    this.spriteGridMovementFinishedCallBack();
                }
            }
        })
    }

    isBlockingTile(){
        if(this.direction===DIRECTION.NONE){
            return false;
        }

        const targetposition={...this.targetPosition};
        const updatedposition=getTargetPostionFromGameObjectPositionAndDirection(targetposition,this.direction);
        return this.doesPositionCollideWithCollionLayer(updatedposition);
        
    }
    doesPositionCollideWithCollionLayer(position:Coordinate){
        if(!this.collisionLayer){
            return false;

        }
        const {x,y }=position;
        if (x < 0 || y < 0 || x >= this.collisionLayer.tilemap.widthInPixels || y >= this.collisionLayer.tilemap.heightInPixels) {
            return true; 
        }
    
        const tile = this.collisionLayer.getTileAtWorldXY(x,y,true);
        return tile.index !==-1;
    }
}