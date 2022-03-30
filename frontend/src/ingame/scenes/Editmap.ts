import Phaser, { Data } from 'phaser'
import Network from '../services/Network'
import store from '../stores'
import { setRoomJoined } from '../stores/RoomStore'
import data from "./editmap.json"
import Item from "../items/Item";
import Chair from "../items/Chair";
import Computer from "../items/Computer";
import Whiteboard from "../items/Whiteboard";
import VendingMachine from "../items/VendingMachine";
import {useState} from 'react';
import Generic from '../items/Generic'

enum ItemCategory {
  GROUND,
  CHAIR,
  WHITEBOARD
}

class Editmap extends Phaser.Scene {
  selectedItemC = ItemCategory.GROUND;
  itemGid = 0;

  network!: Network
  private map!: Phaser.Tilemaps.Tilemap;
  computerMap = new Map<string, Computer>();
  private whiteboardMap = new Map<string, Whiteboard>();
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  // private data = new Data 
  constructor() {
    super('Editmap')
  }

  // context

  preload() { // 시작전 세팅 

    this.load.image('edit', "essets/map/16x16s.png")
    // this.load.image('chairs','https://assets.repress.co.kr/photos/7247aa20193923b2d047bc29df8e4cdc/original.jpg')
    this.load.atlas( // atlas 는 여러개의 스프라이트를 한장의 큰 텍스쳐에 모아놓은 것 
      'cloud_day',
      'essets/background/cloud_day.png',
      'essets/background/cloud_day.json'
    ) //배경 가져오기
    this.load.image('backdrop_day', 'essets/background/backdrop_day.png') //
    this.load.atlas(
      'cloud_night',
      'essets/background/cloud_night.png',
      'essets/background/cloud_night.json'
    )
    this.load.image('backdrop_night', 'essets/background/backdrop_night.png')
    this.load.image('sun_moon', 'essets/background/sun_moon.png')
    
    this.load.tilemapTiledJSON('tilemap1', 'essets/map/editmap.json') // 배경 다 들고오기 
    this.load.spritesheet('tiles_wall', 'essets/map/FloorAndGround.png', { // items 사이즈 지정 
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('chairs', 'essets/items/chair.png', {
      frameWidth: 32,
      frameHeight: 64,
    })
    this.load.spritesheet('computers', 'essets/items/computer.png', {
      frameWidth: 96,
      frameHeight: 64,
    })
    this.load.spritesheet('whiteboards', 'essets/items/whiteboard.png', {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet('vendingmachines', 'essets/items/vendingmachine.png', {
      frameWidth: 48,
      frameHeight: 72,
    })
    this.load.spritesheet('office', 'essets/items/Modern_Office_Black_Shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('basement', 'essets/items/Basement.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('generic', 'essets/items/Generic.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
  }

  init() { // import Network from '../services/Network'
    this.network = new Network()
  }

  create(data: { network: Network }) { // 백그라운드 시작
    this.input.on('gameobjectdown', this.onClicked.bind(this));
    // this.scene.launch('')
    // const teste = this.make.tilemap(
    //   {key : '1616'}
    // )
    // console.log(teste,'맵이욤')
    // const tests =teste.addTilesetImage('xx',"1616")
    // const layer = teste.createLayer(1,tests)
    // this.add.image(400,500,'edit')
    
    this.map = this.make.tilemap({ key: "tilemap" }); // 맵만들기 ⭐⭐⭐
    const FloorAndGround = this.map.addTilesetImage(
      "FloorAndGround",
      "tiles_wall"
    );
    const groundLayer = this.map.createLayer("Ground", FloorAndGround);
    groundLayer.setCollisionByProperty({ collides: true });
    

    const chairs = this.physics.add.staticGroup({ classType: Chair });
    const chairLayer = this.map.getObjectLayer("Chair");
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(
        chairs,
        chairObj,
        "chairs",
        "chair"
      ) as Chair;
      // custom properties[0] is the object direction specified in Tiled
      item.itemDirection = chairObj.properties[0].value;
    });

    // import computers objects from Tiled map to Phaser
    const computers = this.physics.add.staticGroup({ classType: Computer });
    const computerLayer = this.map.getObjectLayer("Computer");
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        computers,
        obj,
        "computers",
        "computer"
      ) as Computer;
      item.setDepth(item.y + item.height * 0.27);
      const id = `${i}`;
      item.id = id;
      this.computerMap.set(id, item);
    });

    // import whiteboards objects from Tiled map to Phaser
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard });
    const whiteboardLayer = this.map.getObjectLayer("Whiteboard");
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        "whiteboards",
        "whiteboard"
      ) as Whiteboard;
      const id = `${i}`;
      item.id = id;
      this.whiteboardMap.set(id, item);
    });

    // import vending machine objects from Tiled map to Phaser
    const vendingMachines = this.physics.add.staticGroup({
      classType: VendingMachine,
    });
    const vendingMachineLayer = this.map.getObjectLayer("VendingMachine");
    vendingMachineLayer.objects.forEach((obj, i) => {
      this.addObjectFromTiled(
        vendingMachines,
        obj,
        "vendingmachines",
        "vendingmachine"
      );
    });

    // const test = this.physics.add.staticGroup({
    //   classType: Generic,
    // });
    // const testLayer = this.map.getObjectLayer("Test");
    // testLayer.objects.forEach((obj, i) => {
    //   const item = this.addObjectFromTiled(
    //     test,
    //     obj,
    //     "Test",
    //     "Test"
    //   ) as Generic;

    // });

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled("Wall", "tiles_wall", "FloorAndGround", false);
    this.addGroupFromTiled(
      "Objects",
      "office",
      "Modern_Office_Black_Shadow",
      false
    );
    this.addGroupFromTiled(
      "ObjectsOnCollide",
      "office",
      "Modern_Office_Black_Shadow",
      true
    );
    this.addGroupFromTiled("GenericObjects", "generic", "Generic", false);
    this.addGroupFromTiled(
      "GenericObjectsOnCollide",
      "generic",
      "Generic",
      true
    );
    this.addGroupFromTiled("Basement", "basement", "Basement", true);
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item; // 가까이 가면 ?
    if (currentItem) {
      // 상호작용 물품이 있을 떄
      // 상호작용 물품이 그대로이면 ?
      if (
        currentItem === selectionItem ||
        currentItem.depth >= selectionItem.depth
      ) {
        return;
      }
      //상호작용 취소하기
      // if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING)
      //   currentItem.clearDialogBox();
    }

    // 새로운 상호작용 템 등록
    playerSelector.selectedItem = selectionItem;
    selectionItem.onOverlapDialog();
  }

  private addObjectFromTiled(
    //⭐ '타일' 관련.. idk
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5;
    const actualY = object.y! - object.height! * 0.5;
    const obj = group
      .get(
        actualX,
        actualY,
        key,
        object.gid! - this.map.getTileset(tilesetName).firstgid
      )
      .setDepth(actualY);
    return obj;
  }

  private addGroupFromTiled(
    // ⭐ 타일 관련.. idk
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup();
    const objectLayer = this.map.getObjectLayer(objectLayerName);
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5;
      const actualY = object.y! - object.height! * 0.5;
      group
        .get(
          actualX,
          actualY,
          key,
          object.gid! - this.map.getTileset(tilesetName).firstgid
        )
        .setDepth(actualY);
    });
    
  }

  onClicked(pointer, objectClicked) {
    console.log('hi')
    objectClicked.destroy();
  }

  selectItem(itemCategory : ItemCategory, gid : number) {
    console.log(itemCategory)
    this.selectedItemC = itemCategory
    this.itemGid = gid
    // if(itemCategory === ItemCategory.GROUND) {
    //   console.log('whiteboard')
    //   this.test = ItemCategory.GROUND
      
    // } else if (itemCategory === ItemCategory.CHAIR) {
    //   console.log('chair')
    //   this.test = ItemCategory.CHAIR
    // }

  }
  private test234 = ['']
  update(t: number, dt: number) {  // 매 프레임 update

    var worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
    var pointTilex = this.map.worldToTileX(this.game.input.mousePointer.worldX)
    var pointTileY = this.map.worldToTileY(this.game.input.mousePointer.worldY);
    // console.log(pointTilex, pointTileY)
    let marker = this.add.graphics(); 
    marker.x = this.map.tileToWorldX(pointTilex);
    marker.y = this.map.tileToWorldY(pointTileY); 

    if (this.input.manager.activePointer.isDown) {
    //   if (this.keyA.isDown) {
    //     // console.log(this.map, '맵 정보')
    //     // console.log(this.map.getTileAt(pointTilex,pointTileY),'마우스로 찍은 위치의 타일 정보')
    //     this.map.destroyLayer('whiteboards')
  
    // }
      if (this.selectedItemC === ItemCategory.GROUND) {
        // this.map.putTileAt(selectedTile, this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY);
        // this.map.removeTileAtWorldXY(this.game.input.mousePointer.worldX, this.game.input.mousePointer.worldY)

      }
      else if(this.selectedItemC === ItemCategory.WHITEBOARD) {

        const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard });
          const item = this.addObjectFromTiled(
            whiteboards,
            {
              "gid": this.itemGid,
              "height":64,
              "id":880,
              "name":"",
              "rotation":0,
              "type":"",
              "visible":true,
              "width":64,
              "x":this.game.input.mousePointer.worldX,
              "y":this.game.input.mousePointer.worldY
             },
             "whiteboards",
             "whiteboard"
          ) as Whiteboard;
          const id = `${1}`;
          item.id = id;
          this.whiteboardMap.set(id, item);

          
  
      } else if (this.selectedItemC === ItemCategory.CHAIR) {
        console.log('chair')
        const chairs = this.physics.add.staticGroup({ classType: Chair })
        // const chairLayer = this.map.getObjectLayer('Chair')
        // chairLayer.objects.forEach((chairObj) => {
          this.addObjectFromTiled(chairs, 
            {"gid":this.itemGid,
              "height":64,
              "id":335,
              "name":"",
              "properties":[
                    {
                    "name":"direction",
                    "type":"string",
                    "value":"down"
                    }],
              "rotation":0,
              "type":"",
              "visible":true,
              "width":32,
              "x": Math.ceil(this.game.input.mousePointer.worldX),
              "y": Math.ceil(this.game.input.mousePointer.worldY),
            }, 'chairs', 'chair') as Chair
          }
      }



    // let selectedTile = this.map.getTileAt(31, 12);
    // if (this.input.manager.activePointer.isDown)
    // { 
    //       // console.log('여기와쯤')

    //       // 여기가 클릭한거별로 바뀌어야함
    //       const chairs = this.physics.add.staticGroup({ classType: Chair })
    //       // const chairLayer = this.map.getObjectLayer('Chair')
    //       // chairLayer.objects.forEach((chairObj) => {
    //         const item = this.addObjectFromTiled(chairs, 
    //           {"gid":2564,
    //             "height":64,
    //             "id":335,
    //             "name":"",
    //             "properties":[
    //                   {
    //                   "name":"direction",
    //                   "type":"string",
    //                   "value":"down"
    //                   }],
    //             "rotation":0,
    //             "type":"",
    //             "visible":true,
    //             "width":32,
    //             "x":this.game.input.mousePointer.worldX,
    //             "y":this.game.input.mousePointer.worldY
    //           }, 'chairs', 'chair') as Chair
    //         // custom properties[0] is the object direction specified in Tiled
    //         item.itemDirection = "down"
    //         // this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], item)
    //       // })
    //       // console.log(data,'데이터')
    //       // data.layers[2].objects?.push({"gid":2564,
    //       // "height":64,
    //       // "id":335,
    //       // "name":"",
    //       // // "properties":[
    //       // //       {
    //       // //       "name":"direction",
    //       // //       "type":"string",
    //       // //       "value":"down"
    //       // //       }],
    //       // "rotation":0,
    //       // "type":"",
    //       // "visible":true,
    //       // "width":32,
    //       // "x":this.game.input.mousePointer.worldX,
    //       // "y":this.game.input.mousePointer.worldY
    //     // });
    //       console.log(data.layers[2].objects)
    //     }
      }
}

export default Editmap;