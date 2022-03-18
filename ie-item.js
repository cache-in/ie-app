import { Atoms } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { artSettings } from './ie-art.js';
import { artCollection } from './ie-art.js';
import { artGlobSettings } from './ie-art.js';

const atoms = new Atoms();

export class Item{

	constructor(id, options){
		this.itemId = id;
		// this.userDevice = options.userDevice;
		this.itemEl = {}; // - root DOM element of the current item
		this.dragEn = false;
		this.appObj = options.appObj;
		// this.startTouch = {};				
	}

	//--------------------------------------------------
	// COMMON METHODS

	setItemEl(element){
		this.itemEl = element;
		this.itemEl.innerHTML = this.itemEl.innerHTML + `<span class="material-icons-outlined ${domStrings.deleteBtn} ${domStrings.itemTool}">delete</span>`;
		
		// save reference for self object in DOM
		element.selfObjRef = this;
	}

	setMoveElementListeners(){		
		this.startPos = atoms.getElementPosRelativeToParent(this.itemEl, this.appObj.imageWrapper);	
		// this.currPos = this.startPos;	
		if(artGlobSettings.touch){
			this.itemEl.addEventListener('touchstart', this.touchStartHandler.bind(this), false);
			this.itemEl.addEventListener('touchmove', this.touchMoveHandler.bind(this), false);
			this.itemEl.addEventListener('touchend', this.endMovement.bind(this), false);			
		} 
	
		// if(artGlobSettings.userDevice === 'desktop'){
			this.itemEl.addEventListener('mousedown', this.mouseDownHandler.bind(this), false);
		// }
	}




	// Add event listeners to item for actions like select and delete 
	addEventListenersToItem(el){
		el.addEventListener('click', this.clickHandler.bind(this), false);
		el.querySelector('.'+domStrings.deleteBtn).addEventListener('click', this.deleteItemClickHandler.bind(this), false);
	}

	//--------------------------------------------------
	// EVENT HANDLERS RELATED TO ITEM MOVEMENT

	touchStartHandler(e){
		if(e.target.classList.contains(domStrings.itemTool)) return;
		if(e.target.classList.contains(domStrings.artItem) || e.target.parentElement.classList.contains(domStrings.artItem)){
			// e.preventDefault();
			const touches = e.touches[0];
			this.start = {			
				// x: touches.pageX,
				// y: touches.pageY,
				x: touches.screenX,
				y: touches.screenY,
			};
			this.startMovement(e.target);			
		}
	}

	mouseDownHandler(e){
		console.log(e.target);
		if(e.target.classList.contains(domStrings.itemTool)) return;
		if(e.target.classList.contains(domStrings.artItem) || e.target.parentElement.classList.contains(domStrings.artItem)){
			console.log('move start');	
			this.itemEl.classList.remove(domStrings.inMove);		
			this.itemEl.classList.add(domStrings.inMove);		
			this.start = {			
				x: e.clientX,
				y: e.clientY,
			};
			if(e.target.classList.contains(domStrings.artItem)){
				this.startMovement(e.target);				
			} else {
				this.startMovement(e.target.parentElement);
			}	
			if(e.target.dataset.class === 'sticker'){
				// prevent default browser intent to download image by drag
				e.preventDefault();	
			}				
		}
	}
	

	startMovement(element){
		// this.currPos = atoms.getElementPosRelativeToParent(this.itemEl, this.appObj.imageWrapper);
		// console.log(this.currPos);
		this.dragEn = true;
	}

	touchMoveHandler(e){
		if(!this.dragEn) return;
		// console.log(e.target);
		if(e.target.classList.contains(domStrings.artItem) || e.target.parentElement.classList.contains(domStrings.artItem)){			
			const touches = e.touches[0];
			this.delta = {
				// x: touches.pageX - this.start.x,
				// y: touches.pageY - this.start.y,
				x: touches.screenX - this.start.x,
				y: touches.screenY - this.start.y
			}
			if(e.target.classList.contains(domStrings.artItem)){
				this.moveByDrag(e.target);
			} else {
				this.moveByDrag(e.target.parentElement);
				// prevent default browser intent to download image by drag
				e.preventDefault();
			}
		}
	}
	
	moveByDrag(element){		
		// let tmpX = this.delta.x + this.currPos.left - this.startPos.left;
		// let tmpY = this.delta.y + this.currPos.top - this.startPos.top;		
		this.translate(element, this.delta.x, this.delta.y, 0);
	}


	moveX(distX){
		this.startPos.left -= distX;
		this.itemEl.style.left = this.startPos.left + 'px';
		artSettings.items[this.itemId].settings.posLeft = this.startPos.left;
	}

	endMovement(){			
		if(this.dragEn){
			console.log('move end');	
			this.dragEn = false;
			if( 'delta' in this && 'x' in this.delta ){				
				this.translate(this.itemEl, 0, 0, 0);
				// this.currPos = atoms.getElementPosRelativeToParent(this.itemEl, this.appObj.imageWrapper);
				
				this.startPos.left += this.delta.x;
				this.itemEl.style.left = this.startPos.left + 'px';
				artSettings.items[this.itemId].settings.posLeft = this.startPos.left;
				
				this.startPos.top += this.delta.y;
				this.itemEl.style.top = this.startPos.top + 'px';
				this.delta = {};
				artSettings.items[this.itemId].settings.posTop = this.startPos.top;
			}			
			this.itemEl.classList.remove(domStrings.inMove);
		}
	}

	translate(elem, dx, dy, speed) {
        var style = elem.style;

        if (!style) return;

        style.webkitTransitionDuration =
            style.MozTransitionDuration =
            style.msTransitionDuration =
            style.OTransitionDuration =
            style.transitionDuration = speed + 'ms';
		

        // style.transitionTimingFunction = "ease-out";   
        style.webkitTransform = 'translateX(' + dx + 'px) ' + 'translateZ(0) ' + 'translateY(' + dy + 'px)';
        style.msTransform =
		style.MozTransform =
		style.OTransform = 'translateX(' + dx + 'px) ' + 'translateZ(0) ' + 'translateY(' + dy + 'px)';
    }

	//--------------------------------------------------
	// CLICK HANDLERS

	clickHandler(e){
		// console.log('parent');
		this.itemSelectClickHandler(e);
	}

	// Select art item by click 
	itemSelectClickHandler(e){
		// console.log("itemSelectClickHandler" + e);
		// console.log(e.target);
		// let clickedItem;
		if(!e.target.classList.contains(domStrings.artItem)){			
			if( e.target.parentElement.classList.contains(domStrings.artItem) ){
				this.appObj.selectedItem = e.target.parentElement;
			} else {
				return;
			}
		} else {
			this.appObj.selectedItem = e.target;
		}
		this.appObj.selectedItemId = this.appObj.selectedItem.getAttribute(domStrings.itemId);
		// mark "selected" clicked item 
		this.appObj.selectedItem.classList.add(domStrings.selectedItem);

		// unmark "selected" other items
		artCollection.unmarkOthers(this.appObj.selectedItemId);
		window.dispatchEvent(this.appObj.selectItemEvent);
		e.stopPropagation();
	}

	// delete art item by click 
	deleteItemClickHandler(e){
		const artItem = e.target.parentElement;
		const itemId = artItem.getAttribute(domStrings.itemId);
		artItem.remove(); 	// remove from DOM
		delete artSettings.items[itemId]; // delete item from artSettings object
		// console.log(artSettings);
	}
}
