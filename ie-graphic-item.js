import { Atoms } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { artCollection, artSettings } from './ie-art.js';
import { artGlobSettings } from './ie-art.js';
import { Item } from './ie-item.js';
const atoms = new Atoms();
export class GraphicItem extends Item{

	constructor(id, options){
		super(id, options);
		
		this.render(id,options);
		this.setMoveElementListeners();

	}

	render(itemId, options = {}){

		// const svgEl 	= options.svgEl.cloneNode(true);	
		this.parentEl 	= options.parent;		
		this.appObj 	= options.appObj;		

		// input parameters
		const settings = {};
		settings.type 	= options.settings.type;
		settings.fill 	= options.settings.fill;
		settings.name 	= options.settings.name;
		settings.topic 	= options.settings.topic;
		settings.width 	= options.settings.width || 100;
		settings.height = options.settings.height || settings.width;
		settings.posLeft = options.settings.posLeft || (this.parentEl.clientWidth/2 - settings.width/2);
		settings.posTop = options.settings.posTop || this.parentEl.clientHeight/2;

		const graphicEl = atoms.createElement({				
			classes	: 	[domStrings.itemType[settings.type], domStrings.artItem],
			attrs	: 	{[domStrings.itemId] : itemId}			
		});

		// graphicEl.innerHTML = `<img class="img" src="${ieData.svgPath + settings.topic + '/' + settings.name + '.svg'}" />								
		// 						<span class="material-icons-outlined ${domStrings.resizeHandle + ' ' + domStrings.itemTool}">
		// 						open_in_full
		// 						</span>
		// 						`;

		graphicEl.innerHTML = `<svg class="svg">
									<use xlink:href="#${settings.topic + '--' + settings.name}" />
								</svg>
								<span class="cover"></span>							
								<span class="material-icons-outlined ${domStrings.resizeHandle + ' ' + domStrings.itemTool}">
								open_in_full
								</span>
								`;
//<span class="cover"></span>	
		graphicEl.style.cssText += `						
						width: 		${settings.width}px;
						height: 	${settings.height}px;
						top: 		${settings.posTop}px;
						left: 		${settings.posLeft}px;	
						z-index:	${itemId};					
					`;

		if(settings.type === 'decor' && settings.fill){
			graphicEl.style.cssText += `						
				fill: 		${settings.fill};	
			`;
		}
		// opacity: 	${this.appObj.initOpacity};				

		// const graphicElInnerImg = graphicEl.querySelector('.img');			
		// graphicElInnerImg.style.cssText += `						
		// 				width: 		${settings.width}px;				
		// 			`;		
		// this.imgInitWidth = settings.size;

		graphicEl.dataset.width = settings.width;			
		graphicEl.dataset.fill = settings.fill;			
		graphicEl.dataset.opacity = this.appObj.initOpacity;			
				
		// this.graphicEl.appendChild(svgEl);
		this.parentEl.appendChild(graphicEl);

		// set (bind) the DOM element object to the item object 
		this.setItemEl(graphicEl);
		this.addEventListenersToItem(graphicEl);

		// Set to element itself and all its descendant elements attribute data-class="text"
		atoms.setDataAttrToElementAndDescendants(graphicEl, 'class', settings.type);
		
		// Save to the art settings the settings of the current item
		artSettings.save(itemId, settings);

		// this.startPos = atoms.getElementPosRelativeToParent(graphicEl, this.appObj.imageWrapper);	
		// subscribe events to resize graphic
		this.resizeHandle = graphicEl.querySelector('.'+domStrings.resizeHandle);
		if(artGlobSettings.touch){
			this.resizeHandle.addEventListener('touchstart', this.touchStartResizeHandler.bind(this), false);
			this.resizeHandle.addEventListener('touchmove', this.touchMoveResizeHandler.bind(this), false);
			this.resizeHandle.addEventListener('touchend', this.endResizeHandler.bind(this), false);			
		} 
			
		this.resizeHandle.addEventListener('mousedown', this.mouseDownResizeHandler.bind(this), false);		

		this.scaleX = 1;
		this.scaleY = 1;		
		this.sizeLim = 20;	// min item size in px
	}




	//--------------------------------------------------
	// EVENT HANDLERS RELATED TO GRAPHIC ITEM RESIZE


	initResize(){
		this.startWidth = this.itemEl.clientWidth;
		this.startHeight = this.itemEl.clientHeight;			
		this.resizeEn = true;
	}

	mouseDownResizeHandler(e){
		if(!e.target.classList.contains(domStrings.resizeHandle)) return;	
		this.startResize = {
			x : e.clientX,
			y :	e.clientY
		}
		this.initResize();
		this.itemEl.classList.remove(domStrings.resizing);		
		this.itemEl.classList.add(domStrings.resizing);		
	}

	touchStartResizeHandler(e){
		if(!e.target.classList.contains(domStrings.resizeHandle)) return;
		
		// e.preventDefault();
		const touches = e.touches[0];
		this.startResize = {
			x : touches.screenX,
			y :	touches.screenY
		}
		this.initResize();	
	}
	
	touchMoveResizeHandler(e){
		if(!this.resizeEn) return;
		// if(!e.target.classList.contains(domStrings.resizeHandle)) return;
		// console.log(e.target);		
		const touches = e.touches[0];
		this.deltaResize = {
			x : touches.screenX - this.startResize.x,
			y :	this.startResize.y - touches.screenY
		}
		this.resize();
		e.preventDefault();
	}

	resize(){
		let newWidth = this.startWidth + this.deltaResize.x;
		let newHeight = this.startHeight + this.deltaResize.y;
		let newHeightAlt = this.startHeight + this.deltaResize.x;
		if(newWidth > this.sizeLim-1 && newHeight > this.sizeLim-1){
			this.itemEl.style.width = (newWidth) + 'px';
			if(this.itemEl.dataset.class === 'decor'){
				this.itemEl.style.height = newHeight + 'px';
			} else {
				this.itemEl.style.height = newHeightAlt + 'px';
			}
			// this.itemEl.style.cssText += `transform: scale(${(newWidth)/this.startWidth}, ${(this.startHeight + this.deltaResize.x)/this.startHeight})`;
			// this.itemEl.style.cssText += `transform: translateX(${this.deltaResize.x/2}px) translateY(${this.deltaResize.x/2 - this.deltaResize.x}px) scale(${(newWidth)/this.startWidth}, ${(this.startHeight + this.deltaResize.x)/this.startHeight})`;
			
			
			let scaleX = this.scaleX * (newWidth)/this.startWidth; 
			if(this.itemEl.dataset.class === 'decor'){
				var scaleY = this.scaleY * newHeight/this.startHeight;
				atoms.animateEl(this.itemEl, 0, -this.deltaResize.y, 0);
			} else {
				var scaleY = this.scaleY * newHeightAlt/this.startHeight;
				atoms.animateEl(this.itemEl, 0, -this.deltaResize.x, 0);
			}
			
			// if( scaleX < 1 ) scaleX = 1;
			// if( scaleY < 1 ) scaleY = 1;
			const itemInnerImg = this.itemEl.querySelector('use');	
			itemInnerImg.style.cssText += `transform: scale(${scaleX}, ${scaleY})`;
			// itemInnerImg.style.cssText += `transform: translateX(${this.deltaResize.x/2}px) translateY(${this.deltaResize.x/2}px) scale(${(newWidth)/this.startWidth}, ${(this.startHeight + this.deltaResize.x)/this.startHeight})`;
			
			// this.itemEl.querySelector
			// if(this.deltaResize.x > 0){
			// 	this.itemEl.style.cssText += 'transform: scale('+ (newWidth)/this.startWidth +', '+ (this.startHeight + this.deltaResize.x)/this.startHeight +')';
			// }
		}
		
	}

	endResizeHandler(e){
		if(!this.resizeEn) return;
		if(this.deltaResize === undefined){
			console.log(this);
		}
		let newWidth = this.startWidth + this.deltaResize.x;
		let newHeight = this.startHeight + this.deltaResize.y;
		let newHeightAlt = this.startHeight + this.deltaResize.x;

		if(newWidth < this.sizeLim ){
			newWidth = this.sizeLim-1;
		}
		if(newHeightAlt < this.sizeLim){
			newHeightAlt = this.sizeLim-1;
			this.deltaResize.x = -this.startHeight+this.sizeLim;
		}
		if(newHeight < this.sizeLim ){
			newHeight = this.sizeLim;
			this.deltaResize.y = -this.startHeight+this.sizeLim;
		}

		this.itemEl.style.width = (newWidth) + 'px';
		this.scaleX *= (newWidth)/this.startWidth; 
		if(this.itemEl.dataset.class === 'decor'){
			this.scaleY *= (newHeight)/this.startHeight; 
			this.startPos.top -= this.deltaResize.y;
			this.itemEl.style.height = newHeight + 'px';
		} else {
			this.scaleY *= (newHeightAlt)/this.startHeight; 
			this.startPos.top -= this.deltaResize.x;
			this.itemEl.style.height = newHeightAlt + 'px';
		}
		// if( this.scaleX < 1 ) this.scaleX = 1;
		// if( this.scaleY < 1 ) this.scaleY = 1;
		const itemInnerImg = this.itemEl.querySelector('use');	
		itemInnerImg.style.cssText += `transform: scale(${this.scaleX}, ${this.scaleY})`;
		
		this.itemEl.style.top = this.startPos.top + 'px';
		this.deltaResize = {
			x : 0,
			y : 0,
		};					
		artSettings.items[this.itemId].settings.width = this.itemEl.clientWidth;
		artSettings.items[this.itemId].settings.height = this.itemEl.clientHeight;
		this.itemEl.dataset.width = artSettings.items[this.itemId].settings.width;
		this.itemEl.dataset.height = artSettings.items[this.itemId].settings.height;
		artSettings.items[this.itemId].settings.posTop = this.startPos.top;
		atoms.animateEl(this.itemEl, 0, 0, 0);
		this.itemEl.classList.remove(domStrings.resizing);	
		
		// const itemInnerImg = this.itemEl.querySelector('.img');	
		// itemInnerImg.style.cssText += `transform: scale(${this.scaleX}, ${this.scaleY})`;
		this.resizeEn = false;
		e.preventDefault();
	}


}
