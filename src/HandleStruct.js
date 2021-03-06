const Constants = require('./structs/Constants');
const PlayerMoving = require('./structs/PlayerMoving');
const wings = [156, 350, 362, 678, 736, 818, 1166, 1206, 1460, 1550, 1574, 1672, 1674, 1738, 1780, 1784, 1824, 1934, 1936, 1938, 1970, 2158, 2160, 2162, 2164, 2166, 2168, 2254, 2256, 2258, 2260, 2262, 2264, 2390, 2392, 2438, 2538, 2642, 2722, 2776, 2930, 2932, 2982, 3104, 3112, 3114, 3120, 3134, 3134, 3144, 3308, 3442, 3512, 3858, 4184, 4412, 4414, 4534, 4628, 4970, 4972, 4986, 5020, 5322, 5738, 5754, 6004, 6144, 6284, 6334, 6694, 6758, 6818, 6842, 7104, 7350, 7582, 9394];

module.exports = function(main, packet, peerid, p) {
  const type = main.Packet.GetStructPointerFromTankPacket(packet);
  const data = main.Packet.unpackPlayerMoving(packet);

  switch(type) {
    case 0: {
      let player = main.players.get(peerid);
      player.x = Math.floor(data.x);
      player.y = Math.floor(data.y);

      player.temp.MovementCount++;
      if (player.temp.MovementCount < 2) {
        let peers = [...main.players.keys()]

        for (let i = 0; i < peers.length; i++) {
          if (!main.Host.checkIfConnected(peers[i]))
            continue;

          if (wings.includes(player.clothes.back)) {
            player.addState('canDoubleJump')
            return main.Packet.sendState(peerid);
          }

          if (peerid === peers[i])
            continue;

          if (!main.Host.isInSameWorld(peerid, peers[i]))
            continue;
        }
      }

      main.players.set(peerid, player);
      main.Packet.sendPData(peerid, data);
      for (let peer of [...main.players.keys()]) {
        if (main.Host.isInSameWorld(peerid, peer))
          main.Packet.sendState(peer);
      }

      if (!player.hasClothesUpdated) {
        player.hasClothesUpdated = true;
        main.players.set(peerid, player);
        main.Packet.updateAllClothes(peerid);
      }
      break;
    }

    case 18: {
      main.Packet.sendPData(peerid, data);
      break;
    }

    case 7: {
      main.Packet.sendPlayerLeave(peerid);
      main.Packet.requestWorldSelect(peerid);
      main.Packet.sendSound(peerid, "audio/door_shut.wav", 0);
      break;
    }

    case 10: {
      let item = main.getItems().get(data.plantingTree);
      let player = main.players.get(peerid);

      if (Object.values(player.clothes).includes(data.plantingTree)) {
        let clothes = Object.entries(player.clothes);
        let equipped = clothes.filter(c => c[1] === data.plantingTree)[0];
        player.clothes[equipped[0]] = 0;

        switch(item.clothingType) {
          case 6: {
            if (wings.includes(data.plantingTree))
              player.removeState('canDoubleJump')
            break;
          }
        }

        if (Constants.ItemEffects[item.name] && player.punchEffects.includes(item.name))
          player.removePunchEffect(item.name);

        main.players.set(peerid, player);
        main.Packet.sendClothes(peerid);
        return main.Packet.sendState(peerid);
      } else {
        if (!player.punchEffects.includes(item.name)) {
          let itemData = [];

          for (let [k, v] of main.getItems()) {
            if (v.name === item.name)
              itemData.push(v);
            else continue;
          }

          if (itemData.length > 0) {
            let type = itemData[0].clothingType;

            for (let i = 0; i < player.punchEffects.length; i++) {
              itemData = [];

              for (let [k, v] of main.getItems()) {
                if (v.name === player.punchEffects[i])
                  itemData.push(v);
                else continue;
              }

              for (let j = 0; j < itemData.length; j++) {
                if (itemData[j].clothingType === type) {
                  if (itemData[j].name !== 'Fist')
                    player.removePunchEffect(itemData[j].name);
                }

                player.addPunchEffect(item.name);
              }
            }  
          }
        }
      }

      switch(item.clothingType) {
        case 0: {
          player.clothes.hair = data.plantingTree;
          break;
        }

        case 1: {
          player.clothes.shirt = data.plantingTree;
          break;
        }

        case 2: {
          player.clothes.pants = data.plantingTree;
          break;
        }

        case 3: {
          player.clothes.feet = data.plantingTree;
          break;
        }

        case 4: {
          player.clothes.face = data.plantingTree;
          break;
        }

        case 5: {
          player.clothes.hand = data.plantingTree;
          break;
        }

        case 6: {
          if (wings.includes(data.plantingTree))
            player.addState('canDoubleJump')

          main.Packet.sendState(peerid);

          player.clothes.back = data.plantingTree;
          break;
        }

        case 7: {
          player.clothes.mask = data.plantingTree;
          break;
        }

        case 8: {
          player.clothes.necklace = data.plantingTree;
          break;
        }
      }

      main.players.set(peerid, player);
      main.Packet.sendClothes(peerid);
      main.Packet.sendState(peerid);
      break;
    }

    case 3: {
      let x = data.punchX;
      let y = data.punchY;

      let player = main.players.get(peerid);
      let world = main.worlds.get(player.currentWorld);
      let _data = new PlayerMoving();
      _data.x = x;
      _data.y = y;
      _data.punchX = x;
      _data.punchY = y;
      _data.xSpeed = 0;
      _data.ySpeed = 0;
      _data.netID = player.netID;
      _data.plantingTree = data.plantingTree;

      data.netID = player.netID;

      if (main.getItems().get(data.plantingTree).actionType === 20) return;
      if (main.getItems().get(data.plantingTree).actionType === 1) return;

      if (data.plantingTree === 18) {
        let block;

        if (world.owner.length > 0 && !world.isPublic && world.owner !== player.tankIDName) {
          main.Packet.sendNothing(peerid, x, y, 0, -1);
          return main.Packet.sendSound(peerid, 'audio/punch_locked.wav', 0);
        }
        
        if (world.items[x + (y * world.width)].background > 0)
          block = world.items[x + (y * world.width)].background;
        
        if (world.items[x + (y * world.width)].foreground > 0)
          block = world.items[x + (y * world.width)].foreground;

        let type = main.getItems().get(block);
        if (!type) return;

        type = type.actionType;

        if (block === 6) return main.Packet.sendNothing(peerid, x, y);

        if (block === 8 && !(player.permissions & Constants.Permissions.admin)) {
          p.create()
            .string('OnTalkBubble')
            .intx(player.netID)
            .string('It\'s too strong to break')
            .intx(0)
            .end();

          main.Packet.sendPacket(peerid, p.return().data, p.return().len);
          return p.reconstruct();
        }
          let worldBlock = world.items[x + (y * world.width)];
          let punchedBlock = main.getItems().get(worldBlock.foreground > 0 ? worldBlock.foreground : worldBlock.background);

          if (punchedBlock) {
            
            if (worldBlock.breakLevel < (punchedBlock.breakHits / 6) - 1) {
              // not destroyed yet
              worldBlock.breakLevel++;

              _data.packetType = 0x8;
              _data.plantingTree = worldBlock.breakLevel + 1;

              setTimeout(() => {
                if (worldBlock.breakLevel !== worldBlock.breakLevel + 1) {
                  // clear it
                  worldBlock.breakLevel = 0;
                }
              }, 12000);

              world.items[x + (y * world.width)] = worldBlock;
              main.worlds.set(world.name, world);

              for (let peer of [...main.players.keys()]) {
                if (main.Host.isInSameWorld(peerid, peer) && main.Host.checkIfConnected(peer)) {
                  main.Packet.sendNothing(peer, x, y, _data.plantingTree, player.netID);
                }
              }

              return;
            } else if (worldBlock.breakLevel >= (punchedBlock.breakHits / 6) - 1) {
              if (worldBlock.foreground > 0)
                worldBlock.foreground = 0;
              else if (worldBlock.background > 0)
                worldBlock.background = 0;

              worldBlock.breakLevel = 0;
              world.items[x + (y * world.width)] = worldBlock;
              main.worlds.set(world.name, world);
            }
          }
      } else {
        let items = player.inventory.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].itemID === data.plantingTree) {
            if (items[i].itemCount > 1) {
              items[i].itemCount -= 1;
            } else {
              items.splice(i, 1);
            }
          }
        }

        player.inventory.items = items;
        let blockType = main.getItems().get(data.plantingTree).actionType;

        if (blockType === 18) {
          world.items[x + (y * world.width)].background = data.plantingTree;
        } else {
          if (blockType === 15 && !(Constants.Permissions.admin & player.permissions)) {
            p.create()
              .string('OnTalkBubble')
              .string('You can\'t do that')
              .end();

            main.Packet.sendPacket(peerid, p.return().data, p.return().len);
            return p.reconstruct();
          }

          world.items[x + (y * world.width)].foreground = data.plantingTree;
        }
      }

      main.worlds.set(player.currentWorld, world);
      main.players.set(peerid, player);
      main.Packet.sendInventory(peerid);

      for (let peer of [...main.players.keys()]) {
        if (!main.Host.checkIfConnected(peer))
          continue;

        if (main.Host.isInSameWorld(peerid, peer))
          main.Packet.sendPacketRaw(peer, 4, main.Packet.packPlayerMoving(data), 56, 0);
      }
      break;
    }
  }
};
