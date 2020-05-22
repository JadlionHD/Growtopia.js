module.exports = function(main, packet, peerid, p) {
  let netID = packet.get('netid');
  netID = parseInt(netID);
  let player = [];

  for (let [i, p] of main.players) {
    if (p.netID === netID)
      player.push(p);
  }

  player = player[0];

  let dialog = main.Dialog.defaultColor()
    .addLabelWithIcon(player.isGuest ? player.requestedName : player.displayName, '18', 'Big')
    .addSpacer('small')
    .addButton('addFriend', 'Add as Friend')
    .addButton('worldBan', '`4World Ban')
    .endDialog('editPlayer', 'Cancel', '')
    .embed('player', player.isGuest ? player.mac : player.tankIDName)
    .addQuickExit();

  if (netID && !isNaN(netID)) {
    p.create()
      .string('OnDialogRequest')
      .string(dialog.str())
      .end();

    main.Packet.sendPacket(peerid, p.return().data, p.return().len);
    p.reconstruct();
    dialog.reconstruct();
  }
}
