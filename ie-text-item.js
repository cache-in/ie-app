import { Atoms } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { artCollection, artSettings } from './ie-art.js';
import { artGlobSettings } from './ie-art.js';
import { Item } from './ie-item.js';
const atoms = new Atoms();

// export class TextItem extends Item{
export class TextItem extends Item{

	constructor(id, options){
		super(id, options);
		// Constant parameters of the app
		this.fontToHeightRatio = 1.4;
		this.minTextWidth = 100;
		
		this.render(id,options);
		this.setMoveElementListeners();

	}

	render(itemId, options = {}){

		this.parentEl 		= options.parent;
		this.testItem		= options.testItem;
		// this.userDevice 	= options.userDevice;
		// this.appleMobDevice = options.appleMobDevice;
		this.appObj 		= options.appObj;		

		// input parameters
		const settings = {};
		settings.type 	= 'text';
		settings.text 	= options.settings.text || 'Новый текст';
		settings.fontSize 	= options.settings.fontSize || this.appObj.initFontSize*this.appObj.fontStep;
		settings.fontFamily = options.settings.fontFamily || this.appObj.defaultFont;
		settings.fontColor = options.settings.fontColor || '#ffffff';
		settings.textAlign = options.settings.textAlign || 'left';
		settings.textWidth = options.settings.textWidth || 200;
		settings.posLeft = options.settings.posLeft || (this.parentEl.clientWidth/2 - settings.textWidth/2);
		settings.posTop = options.settings.posTop || this.parentEl.clientHeight/2;
		settings.linesNum = options.settings.linesNum || 1;
		settings.textHeight = settings.linesNum * (this.fontToHeightRatio * settings.fontSize);

		const textEl = atoms.createElement({				
			classes	: 	[domStrings.itemType[settings.type], domStrings.artItem],
			attrs	: 	{[domStrings.itemId] : itemId}			
		});
		
		textEl.style.cssText += `						
						top: 			${settings.posTop}px;
						left: 			${settings.posLeft}px;	
						z-index:		${itemId};					
					`;

		textEl.dataset.font = settings.fontFamily;
		textEl.dataset.size = settings.fontSize;
		textEl.dataset.color = settings.fontColor;
		textEl.dataset.align = settings.textAlign;

		textEl.innerHTML = `<textarea class="${domStrings.textArea}">${settings.text}</textarea>`;

		const textArea = textEl.querySelector('.'+domStrings.textArea);

		this.recalcTextWidth(settings);
		textArea.style.cssText += `
						height:			${settings.linesNum*(settings.fontSize*this.fontToHeightRatio)}px;
						width:			${settings.textWidth}px;
						line-height:	${settings.fontSize*this.fontToHeightRatio}px;
						color:			${settings.fontColor};
						font-family: 	${settings.fontFamily};
						font-size: 		${settings.fontSize}px;
					`;
		// if(artGlobSettings.touch && !artGlobSettings.appleMobileDevice) textArea.style.cssText += 'pointer-events: none;'; 			
		// if(artGlobSettings.touch) textArea.style.cssText += 'pointer-events: none;'; 			
		if(artGlobSettings.userDevice === 'mobile') {
			textArea.style.cssText += 'pointer-events: none!important;'; 		
			textArea.setAttribute('readonly', 'readonly');	
		}
		this.parentEl.appendChild(textEl);

		// set (bind) the DOM element object to the item object 
		this.setItemEl(textEl);

		this.addEventListenersToItem(textEl);


		// Set to element itself and all its descendant elements attribute data-class="text"
		atoms.setDataAttrToElementAndDescendants(textEl, 'class', settings.type);
		
		// Save to the art settings the settings of the current item
		// this.saveArtItemSettings(this.itemCounter++, settings);
		artSettings.save(itemId, settings);

		// Aux variable to detect double click
		this.doubleClickWait = 0;
		
	}

	// recalculate and refresh width and height of the textarea with new text and upadte corresponding item settings
	rerenderTextArea(textArea, itemSettings, cursorPos){
		// split text by line break
		let textLines = itemSettings.text.split(/\r?\n/);
		itemSettings.linesNum = textLines.length;
		
		// adjust lines number and height styling
		itemSettings.textHeight = itemSettings.linesNum * (this.fontToHeightRatio * itemSettings.fontSize);
		textArea.style.height = itemSettings.textHeight + 'px';
		
		// font family
		textArea.style.fontFamily = '"'+itemSettings.fontFamily+'"';

		// font size
		textArea.style.fontSize = itemSettings.fontSize+'px';
		textArea.style.lineHeight = itemSettings.fontSize*this.fontToHeightRatio+'px';

		// recalculate and aplly width
		let prevWidth = itemSettings.textWidth;	
		this.recalcTextWidth(itemSettings);
		textArea.innerHTML = itemSettings.text;
		textArea.value = itemSettings.text;
		if(this.itemEl.dataset.align === 'center'){
			this.moveX((itemSettings.textWidth - prevWidth)/2);
		}
		textArea.style.width = itemSettings.textWidth+'px';
		textArea.selectionStart = cursorPos;

		textArea.setSelectionRange(textArea.selectionStart,textArea.selectionStart);

		
	}

	// calculate max width of the text content and aplly it to the target item
	recalcTextWidth(settings){
		const textArea = this.testItem.querySelector("."+domStrings.textArea);	
		// set font style as at the target item
		textArea.style.cssText += `
				font-family: 	${settings.fontFamily};
				font-size: 		${settings.fontSize}px;
			`;
		
		// split text by line break
		const textLines = settings.text.split(/\r?\n/);
					
		settings.textWidth = this.minTextWidth;
		// find width of the longest line in text
		for (let i = 0; i < textLines.length; i++) {
			// for (let ii = 0; ii < textLines[i].length; ii++) {
			// 	if(textLines[i][ii] === ' ') textLines[i] = atoms.setCharAt(textLines[i],ii,'w');
			// 	// if(textLines[i][ii] === ' ') textLines[i] = atoms.setCharAt(textLines[i],ii,'&nbsp;');
			// }
			textArea.innerHTML = textLines[i];//.replace(/\s+/g,'&nbsp;');	
			if( textArea.offsetWidth > settings.textWidth ){
				settings.textWidth = textArea.offsetWidth+10;			
			}		
		}		

	}	

	// Reruled move depending on align
	// moveByDrag(element){		
	// 	if(this.itemEl.dataset.align === 'left'){
	// 		var tmpX = this.delta.x + this.currPos.left - this.startPos.left;
	// 	} else{
	// 	// if(this.itemEl.dataset.align === 'right'){
	// 		var tmpX = this.delta.x + this.currPos.right - this.startPos.right;
	// 	} 
	// 	let tmpY = this.delta.y + this.currPos.top - this.startPos.top;		
	// 	this.translate(element, tmpX, tmpY, 0);
	// }

	// Reruled end movement depending on align
	endMovement(){			
		if(this.dragEn){
			// console.log('move end');	
			this.dragEn = false;
			if( 'delta' in this && 'x' in this.delta ){				
				this.translate(this.itemEl, 0, 0, 0);
				// this.currPos = atoms.getElementPosRelativeToParent(this.itemEl, this.appObj.imageWrapper);
				if(this.itemEl.dataset.align === 'right'){
					this.startPos.right -= this.delta.x;
					this.itemEl.style.right = this.startPos.right + 'px';
					artSettings.items[this.itemId].settings.posRight = this.startPos.right;
				} else {
					this.startPos.left += this.delta.x;
					this.itemEl.style.left = this.startPos.left + 'px';
					artSettings.items[this.itemId].settings.posLeft = this.startPos.left;					
				}
				this.itemEl.style.top = (this.startPos.top + this.delta.y) + 'px';
				this.startPos.top = (this.startPos.top + this.delta.y);
				this.delta = {};
				artSettings.items[this.itemId].settings.posTop = this.startPos.top;
			}			
			this.itemEl.classList.remove(domStrings.inMove);
		}
	}

	//--------------------------------------------------
	// CLICK HANDLERS

	// Reruled Click Handler
	clickHandler(e){
		// console.log('child');
		
		if(this.doubleClickWait === 0){
			// this.itemSelectClickHandler(e);
			this.doubleClickWait = 1;
			setTimeout(() => { this.doubleClickWait = 0; },200)
		} else {
			this.doubleClickHandler(e);
		}		
	}

	doubleClickHandler(e){
		// console.log('double click');
		if(artGlobSettings.userDevice === 'mobile'){// && !artGlobSettings.appleMobileDevice){

			// if(!e.target.classList.contains(domStrings.artItem)){
			// 	targetTextArea = e.target;
			// } else {
			// 	targetTextArea = e.target.querySelector(domStrings.textArea);
			// }
			
			this.appObj.openUpdateTextForm(e);
		}
	}



}
