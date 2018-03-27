import './style.css';

let windows = [];
let dev = true;


document.addEventListener("DOMContentLoaded", function() {
    // Resize
    window.addEventListener("resize", function(){
        System.onResize();
    }, false);
    System.onResize();

    // Animations
    setTimeout(function(){
        document.getElementById('system_bar').className = 'active';
    }, (dev)?0:2000);
    setTimeout(function(){
        // Remove progress bar
        let el = document.getElementById('progress');
        el.parentNode.removeChild(el);

        // Create windows
        windows.push(new Terminal({name:'Terminal'}));

        // Create shortcuts
        new ShortcutTerminal();
        new ShortcutParcours();

        // Lose focus
        document.getElementById('system_content').addEventListener('click', function(){
            System.loseFocusWindows();
        }, false);
    }, (dev)?0:5500);

    // Title
    new OSTitle(document.querySelector('#system_bar .title'));
    // Time
    new SystemTime(document.getElementById('system_time'));
    // User icon
    document.querySelector('#system_bar .user_icon').addEventListener('click', function(){
        System.createUniqueWindow({name:'Credits', content:'#credits'});
    });
});

class Window {

    constructor(options){
        // Init
        this.options = options;
        this.id = new Date().valueOf();
        // Events
        this.mouseHandler = this.handleMove.bind(this);
        // DOM
        this.elem = document.createElement('div');
        this.elem.className = 'window';
        // Title
        let title = document.createElement('span');
        title.innerHTML = options.name;
        // Close button
        let close = document.createElement('div');
        close.className = 'close';
        close.addEventListener('click', this.close.bind(this), false);
        let separator = document.createElement('div');
        separator.className = 'separator';
        // Title bar
        this.titlebar = document.createElement('h1');
        this.titlebar.appendChild(title);
        this.titlebar.appendChild(separator);
        this.titlebar.appendChild(close);
        // Title bar move
        this.titlebar.addEventListener('mousedown', this.mouseHandler, false);
        this.titlebar.addEventListener('mouseup', this.mouseHandler, false);
        this.elem.addEventListener('click', this.mouseHandler, false);
        this.elem.appendChild(this.titlebar);
        // Content
        this.content = document.createElement('div');
        if(typeof options.content !== "undefined"){
            this.content.appendChild(document.querySelector(options.content).cloneNode(true));
        }
        this.elem.appendChild(this.content);
        // Center
        this.elem.style.left = (document.body.clientWidth/2 - 300)+'px';
        this.elem.style.top = '90px';
        // Add to document
        document.getElementById('system_content').appendChild(this.elem);
        setTimeout(this.show.bind(this), 10);
    };

    loseFocus(){
        this.elem.className = this.elem.className.replace(' focus', '');
    }

    setFocus(){
        if(this.elem.className.indexOf('focus') === -1) this.elem.className += ' focus';
        System.loseFocusWindows(this.id);
    }

    close(){
        document.getElementById('system_content').removeChild(this.elem);
        System.closeWindow(this);
    }

    show(){
        this.elem.className+=' active';
    }

    handleMove(event) {
        switch(event.type) {
            case 'click':
                this.setFocus();
                this.onMouseUp();
                break;
            case 'mousedown':
                this.setFocus();
                this.moving = true;
                this.offset = {
                    x : this.elem.offsetLeft - event.clientX,
                    y : this.elem.offsetTop - event.clientY
                };
                this.elem.addEventListener('mousemove', this.mouseHandler, false);
                break;
            case 'mouseup':
                this.moving = false;
                this.elem.removeEventListener('mousemove', this.mouseHandler, false);
                break;
            case 'mousemove':
                if(this.moving){
                    this.elem.style.left = (event.clientX + this.offset.x) + 'px';
                    this.elem.style.top  = (event.clientY + this.offset.y) + 'px';
                }
                break;
        }
        event.stopPropagation();
    }

    onMouseUp(){}
}

class Terminal extends Window {
    constructor(options){
        super(options);
        // Events
        this.keyHandler = this.handleKey.bind(this);

        this.elem.className += ' terminal';
        this.input = document.createElement('input');
        this.input.addEventListener('keydown', this.keyHandler, false);
        // this.input.addEventListener('keyup', this.keyHandler, false);
        this.elem.appendChild(this.input);

        // Method
        this.methods = [
            {
                name:'credits',
                action: function(){
                    System.createUniqueWindow({name:'Credits', content:'#credits'});
                }
            },
            {
                name:'parcours',
                action: function(){
                    windows.push(new Timeline({name:'Parcours', events:'#parcours event'}));
                }
            }
        ];
        this.history = [];
    }

    onMouseUp(){
        this.setCaretAtEnd();
    }

    handleKey(){
        switch(event.type) {
            case 'keydown':
            // case 'keyup':
                if(event.key === "Tab"){
                    let content = '';
                    for(let i=0; i<this.methods.length; i++){
                        content+=this.methods[i].name+'<br/>';
                    }
                    this.addline('ls-files', content);
                }else if(event.key === "Enter"){
                    let launched = false;
                    for(let i=0; i<this.methods.length; i++){
                        if(this.input.value === this.methods[i].name){
                            console.log('launch '+this.methods[i].name);
                            launched = true;
                            this.methods[i].action();
                        }
                    }
                    if(!launched){
                        this.addline('', 'Commande <strong>\''+this.input.value+'\'</strong> inconnue')
                    }
                    this.history.push(this.input.value);
                    this.input.value = '';
                }else if(event.key === "ArrowUp"){
                    this.input.value = this.history[0];
                }else{
                    break;
                }
                // Cancel key
                event.preventDefault();
                break;
        }
    }

    setCaretAtEnd() {
        let elemLen = this.input.value.length;
        // For IE Only
        if (document.selection) {
            // Set focus
            this.input.focus();
            // Use IE Ranges
            let oSel = document.selection.createRange();
            // Reset position to 0 & then set at end
            oSel.moveStart('character', -elemLen);
            oSel.moveStart('character', elemLen);
            oSel.moveEnd('character', 0);
            oSel.select();
        }
        else if (this.input.selectionStart || this.input.selectionStart === '0') {
            // Firefox/Chrome
            this.input.selectionStart = elemLen;
            this.input.selectionEnd = elemLen;
            this.input.focus();
        }
    }

    addline(classes, content){
        let div = document.createElement('div');
        div.className = classes;
        div.innerHTML = content;
        this.content.appendChild(div);
    }
}

class Timeline extends Window {
    constructor(options) {
        super(options);

        this.elem.className += ' timeline';

        /** SCROLL **/
        // Events
        this.wheelHandler = this.handleMousewheel.bind(this);
        this.content.addEventListener('mousewheel', this.wheelHandler, false);
        // DOM
        this.content.style.width = this.elem.clientWidth+'px';
        this.content.style.height = this.elem.clientHeight-this.titlebar.clientHeight+'px';
        let div = this.content.childNodes[0];
        div.style.width = (this.elem.clientWidth*1.5)+'px';
        div.style.height = (this.elem.clientWidth*1.5)+'px';
        div.style.top = -(this.elem.clientWidth*1.5-this.content.clientHeight)/2+'px';
        div.style.left = -(this.elem.clientWidth*1.5-this.content.clientWidth)/2+'px';
        // Fake scroll
        this.scrollbar = document.createElement('div');
        this.scrollbar.className = 'scrollbar';
        for(let i=0; i<div.children[0].children.length; i++){
            this.scrollbar.appendChild(document.createElement('div'));
        }
        this.scrollbarMarker = document.createElement('span');
        this.scrollbarMarker.className = 'marker';
        this.scrollbar.appendChild(this.scrollbarMarker);
        this.content.appendChild(this.scrollbar);
        // Animation
        this.animationNbState = 12;
        this.animationProgress = 0;
        this.animationMax = (div.children[0].children.length-1)*this.animationNbState;
        this.prevCurrent = null;
    }

    handleMousewheel(event) {
        this.animationProgress -= Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this.animationProgress = Math.min(Math.max(0, this.animationProgress), this.animationMax);
        let current = Math.floor(this.animationProgress/this.animationNbState);
        let progress = this.animationProgress % this.animationNbState;
        let style = ((this.animationNbState-progress)*(100/this.animationNbState))+'%';
        if(current>0){
            this.content.children[0].children[0].children[current-1].children[0].style.width = '0%';
            this.content.children[0].children[0].children[current-1].children[0].style.height = '0%';
        }
        this.content.children[0].children[0].children[current].children[0].style.width = style;
        this.content.children[0].children[0].children[current].children[0].style.height = style;
        // Scroll
        this.scrollbar.children[current].className = 'active';
        if(this.prevCurrent !== null && this.prevCurrent !== current) this.scrollbar.children[this.prevCurrent].className = '';
        this.prevCurrent = current;
        this.scrollbarMarker.style.top = ((this.animationProgress/this.animationMax)*75)+'%';
    }
}

class SystemTime {
    constructor(elem){
        this.elem = elem;
        this.mode = 'short';
        setInterval(this.update.bind(this), 60000);
        this.update();
    }

    update(){
        let date = new Date();
        if(this.mode == 'long'){
            this.elem.innerHTML = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})+'<br/>'+date.toLocaleDateString();
        }else{
            this.elem.innerHTML = date.toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute:'2-digit'});
        }
    }
}

class OSTitle {
    constructor(elem){
        let text = elem.innerHTML;
        elem.innerHTML = '';
        let shuffle = Math.floor((Math.random() * 10));
        let container = document.createElement('div');
        for(let i=0; i<text.length; i++){
            let letter = document.createElement('span');
            letter.innerText = text[i];
            letter.className = 'title_'+((i+shuffle)%7);
            if(letter.innerText == " "){
                letter.style.marginTop = '1px';
            }else{
                letter.style.marginTop = Math.floor(Math.random() * 5)+'px';
            }
            letter.style.zIndex = 100-i;
            container.appendChild(letter);
        }
        elem.appendChild(container);
    }
}

class System {

    // Set le body to document height
    static onResize(){
        document.querySelector('body').style.height = document.documentElement.clientHeight+'px';
    }

    // Create unique window by content selector
    static createUniqueWindow(options){
        let exist = false;
        windows.forEach(function(window){
            if(window.options.content === options.content){
                exist = true;
                window.setFocus();
                return false;
            }
        });
        if(!exist){
            let window = new Window(options);
            window.setFocus();
            windows.push(window);
        }
    }

    static loseFocusWindows(id){
        windows.forEach(function(window){
            if(id !== window.id) window.loseFocus();
        })
    }

    static closeWindow(window){
        windows.splice(windows.indexOf(window), 1);
    }
}

class Shortcut {

    constructor(options){
        this.clickHandler = this.handleClick.bind(this);
        // DOM
        this.elem = document.createElement('div');
        this.elem.addEventListener('click', this.clickHandler, false);
        let tooltip = document.createElement('span');
        tooltip.innerText = options.tooltipText;
        this.elem.appendChild(tooltip);
        // Add to document
        document.getElementById('shortcuts').appendChild(this.elem);
    }

    handleClick(event){};
}

class ShortcutTerminal extends Shortcut{

    constructor(){
        super({tooltipText:'Terminal'});
        this.elem.className = 'ic_terminal';
    }

    handleClick(event){
        let window = new Terminal({name:'Terminal'});
        window.setFocus();
        windows.push(window);
    }
}


// TODEL
class ShortcutParcours extends Shortcut{

    constructor(){
        super({tooltipText:'Parcours'});
        this.elem.className = 'ic_terminal';
    }

    handleClick(event){
        let window = new Timeline({name:'Parcours', content: '#parcours'});
        window.setFocus();
        windows.push(window);
    }
}