module.exports = {
  name: 'mod',
  requiredPerms: 1,
  run: function(main, arguments, peerid, p) {
    let player = main.players.get(peerid);
    if (player.states.includes('canWalkInBlocks') || player.states.includes('isModState')) {
      player.removeState('canWalkInBlocks');
      player.removeState('isModState');
      
      p.create()
        .string('OnConsoleMessage')
        .string('You can no longer walk through blocks.')
        .end();

      main.Packet.sendPacket(peerid, p.return().data, p.return().len);
      p.reconstruct();

      main.Packet.sendState(peerid);
    } else {
      player.addState('canWalkInBlocks');
      player.addState('isModState');
      
      p.create()
        .string('OnConsoleMessage')
        .string('You can now walk through blocks.')
        .end();

      main.Packet.sendPacket(peerid, p.return().data, p.return().len);
      p.reconstruct();

      main.Packet.sendState(peerid);
    };
  }
};
