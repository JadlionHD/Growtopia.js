const Constants = require('../structs/Constants');

module.exports = {
  name: 'lock',
  requiredPerms: 1,
  run: function(main, arguments, peerid, p) {
    let dialog = main.Dialog.defaultColor()
      .addLabelWithIcon('What would you like to do with this world?', '242', 'small')
      .addSpacer('small')
      .addButton('lock', 'Lock this World.')
      .addButton('removeLock', 'Remove the Lock from this World.')
      .embed('user', peerid)
      .endDialog('lockWorld', 'Cancel', '')

    p.create()
      .string('OnDialogRequest')
      .string(dialog.str())
      .end();

    main.Packet.sendPacket(peerid, p.return().data, p.return().len)
    p.reconstruct();
    dialog.reconstruct();
  }
};