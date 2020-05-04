// Modules
const {remote} =  require('electron');

// Menu template
const template = [
    {
        label: 'Items',
        submenu: [
            {
                label: 'Add New',
                click: window.newItem,
                accelerator: 'CmdOrCtrl+o'
            },
            {
                label: 'Read Item',
                accelerator: 'CmdOrCtrl+Enter',
                click: window.openItem
            },
            {
                label: 'Delete Item',
                accelerator: 'CmdOrCtrl+Backspace',
                click: window.deleteItem
            },
            {
                label: 'Open in Browser',
                accelerator: 'CmdOrCtrl+shift+o',
                click: window.openItemNative

            }
        ]
    },
    {
        role: 'editMenu'
    },
    {
        role: 'windowMenu'
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn more',
                click: () => {shell.openExternal('http://www.google.com')}
            }
        ]
    }
];

// Set Mac-specific first menu item

if(process.platform === 'linux'){
    template.unshift({
        label: remote.app.getName(),
        submenu: [
            {role: 'about'},
            {type: 'separator'},
            {role: 'services'},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideothers'},
            {role: 'unhide'},
            {role: 'quit'},
        ]
    })
}

// Build menu
const menu = remote.Menu.buildFromTemplate(template);

// Set as main app menu
remote.Menu.setApplicationMenu(menu);