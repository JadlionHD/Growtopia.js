const PlayerInfo = require('../structs/PlayerInfo');
const Constants = require('../structs/Constants');
const crypto = require('crypto');

module.exports = function(main, packet, peerid, p) {
  let type = packet.get('dialog_name');

  switch(type) {
    case 'register': {
      let player = main.players.get(peerid);
      if (!player.isGuest) {
        p.create()
          .string('OnConsoleMessage')
          .string('You cannot make an account with a registered id.')
          .end();

        main.Packet.sendPacket(peerid, p.return().data, p.return().len);
        return p.reconstruct();
      }

      if (!packet.has('username') ||
        !packet.has('password') ||
        !packet.has('email') ||
        !packet.get('email').match(/\w+@\w+.\w+/g)) {
        p.create()
          .string('OnConsoleMessage')
          .string('Some of the info given is invalid, please try again.')
          .end();

        main.Packet.sendPacket(peerid, p.return().data, p.return().len);
        return p.reconstruct();
      }

      let username = packet.get('username');
      let password = packet.get('password');
      let email = packet.get('email');

      if (username.match(/\W+/g) && username.match(/\W+/g).length > 0) {
        p.create()
          .string('OnConsoleMessage')
          .string('Username cannot be empty or contain symbols.')
          .end()

        main.Packet.sendPacket(peerid, p.return().data, p.return().len);
        return p.reconstruct();
      }

      if (main.playersDB.has(username.toLowerCase())) {
        p.create()
          .string('OnConsoleMessage')
          .string('An account with this username already exists.')
          .end();

        main.Packet.sendPacket(peerid, p.return().data, p.return().len);
        return p.reconstruct();
      }

      let newPlayer = new PlayerInfo();
      for (let key of Object.keys(player)) {
        newPlayer[key] = player[key];
      }

      newPlayer.tankIDName = username;
      newPlayer.tankIDPass = crypto.createHmac('sha256', main.secret).update(password).digest('hex');
      newPlayer.requestedName = "";
      newPlayer.displayName = username;
      newPlayer.properName = username;
      newPlayer.email = email;
      newPlayer.rawName = username.toLowerCase();
      newPlayer.states = [];
      newPlayer.temp = {};
      newPlayer.isGuest = false;

      main.playersDB.set(newPlayer.rawName, newPlayer);
      p.create()
        .string('OnConsoleMessage')
        .string('`2Successfully registered.')
        .end();

      main.Packet.sendPacket(peerid, p.return().data, p.return().len);
      p.reconstruct();

      p.create()
        .string('SetHasGrowID')
        .int(1)
        .string(username)
        .string(password)
        .end();

      main.Packet.sendPacket(peerid, p.return().data, p.return().len);
      p.reconstruct();

      main.Packet.sendQuit(peerid, true);

      break;
    }

    case 'editPlayer': {
      // soon
      break;
    }

    case 'lockWorld': {
      let player = main.players.get(packet.get('user'));
      let buttonClicked = packet.get('buttonClicked');
      let world = main.worlds.get(player.currentWorld);

      if (buttonClicked) {
        switch(buttonClicked.toLowerCase()) {
          case 'lock': {
            if (world.owner.length > 0) {
              p.create()
                .string('OnConsoleMessage')
                .string('`4World already locked.`o')
                .end();

              main.Packet.sendPacket(peerid, p.return().data, p.return().len);
              return p.reconstruct();
            }

            world.owner = player.tankIDName;
            world.isPublic = false;

            main.Packet.setNickname(peerid, `\`2${player.displayName}`)

            main.worlds.set(world.name, world);
            player.addRole('worldOwner');

            p.create()
              .string('OnConsoleMessage')
              .string(`World locked by ${player.displayName}`)
              .end();

            for (let peer of [...main.players.keys()]) {
              if (main.Host.isInSameWorld(peer, peerid) && main.Host.checkIfConnected(peer)) {
                main.Packet.sendPacket(peer, p.return().data, p.return().len);
                p.reconstruct();

                main.Packet.sendSound(peer, 'audio/use_lock.wav', 0);
                
                if (peer === peerid)
                  main.Packet.sendSound(peer, 'audio/achievement.wav', 0);
              }
            }
            break;
          }

          case 'removelock': {
            player.removeRole('worldOwner');
            
            world.owner = "";
            world.isPublic = true;

            if (player.displayName.startsWith('`2'))
              player.displayName = player.displayName.slice(2);

            player.removeRole('worldOwner');
            p.create()
              .string('OnConsoleMessage')
              .string(`The lock from ${world.name} was removed!`)
              .end();

            for (let peer of [...main.players.keys()]) {
              if (main.Host.isInSameWorld(peer, peerid) && main.Host.checkIfConnected(peer)) {
                main.Packet.sendPacket(peer, p.return().data, p.return().len);
                p.reconstruct();
              }
            }

            main.Packet.setNickname(peerid, player.displayName);

            main.players.set(peerid, player);
            main.worlds.set(world.name, world);
            break;
          }
        }
      }
      break;
    }

    default: {
      console.log(`Unhandled dialog: ${type}`);
      break;
    }
  }
};
