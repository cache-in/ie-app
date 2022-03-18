import { Atoms } from '../atoms.js';
import { ScrollControl } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { ieStyles } from './ie-dom.js';
import { Request } from '../modules/request.js';
import { artSettings } from './ie-art.js';
import { artCollection } from './ie-art.js';
import { artGlobSettings } from './ie-art.js';
import { ResultScreen } from './ie-result-screen.js';
import { TextItem } from './ie-text-item.js';
import { DecorItem } from './ie-decor-item.js';
import { StickerItem } from './ie-sticker-item.js';
import { Tuner } from '../modules/tuner.js';

// const resultScreen = new ResultScreen();
const atoms = new Atoms();
const scrollControl = new ScrollControl();

const appVersion = '1.0';
const apiVersion = '1.0';
export class ImageEditorApp{

	constructor(options){

		// input parameters
		const template 	= options.template || {};
		const imageEl 	= options.imageEl.cloneNode(true) || {};
		this.loadingBG = options.bg || null;

		this.userRole = options.role || 'visitor';

		// Applied settings of the user's art 
		// artSettings = {};
		artSettings.version = appVersion;
		artSettings.api 	= apiVersion;

		// Counter of the items added to the art (it provides id for items)
		this.itemCounter = 0;

		// Determine user device
		artGlobSettings.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
		artGlobSettings.appleMobileDevice = navigator.userAgent.match(/ipad|ipod|iphone/i) ? 'true' : false;	
		artGlobSettings.userDevice = (window.screen.width > 800 ) ? 'desktop' : 'mobile';
		artGlobSettings.userScreenHeight = document.documentElement.clientHeight || document.body.clientHeight;
		artGlobSettings.userScreenWidth = document.documentElement.clientWidth || document.body.clientWidth;
		// Custom event(s)
		this.selectItemEvent = new Event('selectItemEvent');
		window.addEventListener('selectItemEvent', this.selectItemEventHandler.bind(this), false);

		this.currentDisplacement = 0;

		// MENUS 
		this.menus = new Array();

		//--------------------------------------------------
		// init and set workspace

		// MAIN APP WRAPPER
		this.editorAppEl =  atoms.createElement({				
			classes: 	["editor-app"]				
		});
		
		const body = document.querySelector('body');		
		body.appendChild(this.editorAppEl);

		// WORKSPACE
		const workspace =  atoms.createElement({				
			classes: 	["editor-app-workspace"]				
		});
		workspace.style.height = artGlobSettings.userScreenHeight + 'px';

		this.editorAppEl.appendChild(workspace);

		// TOPBAR
		this.topbar =  atoms.createElement({				
			classes: 	["editor-topbar"]				
		});

		// CANVAS
		this.canvas =  atoms.createElement({				
			classes: 	["editor-main-panel"]				
		});
		this.canvas.style.height = (this.editorAppEl.clientHeight < 800) ? this.editorAppEl.clientHeight : 800 * 0.98 - 110 + 'px';
		
		// CNTRL BAR
		this.cntrlBar =  atoms.createElement({				
			classes: 	["editor-cntrl-bar"]				
		});

		// BOTTOM MENU
		this.bottomMenu =  atoms.createElement({				
			classes: 	["menu-bottom"]				
		});

		// PICK STICKER PANEL 
		this.stickersPanel =  atoms.createElement({				
			classes: 	["stickers-panel"]				
		});		

		// PICK DECOR PANEL 
		this.decorsPanel =  atoms.createElement({				
			classes: 	["decors-panel"]				
		});
		

		this.graphicPanel = {
			sticker : this.stickersPanel,
			decor : this.decorsPanel,
		};
			

		// TEXT EDIT PANEL
		this.textEditPanel =  atoms.createElement({				
			classes: 	["text-edit-panel"]				
		});
		
		
		// UPDATE PROPERTY PANELS WRAPPER
		this.updateTextPropWrap =  atoms.createElement({				
			classes: 	["update-text-property-wrapper"]				
		});		

		// UPDATE DECOR PROPERTY PANEL
		this.updateDecorPropPanel =  atoms.createElement({				
			classes: 	["update-decor-property-panel"]				
		});	

		this.bottomMenu.appendChild(this.stickersPanel);
		this.bottomMenu.appendChild(this.decorsPanel);
		this.bottomMenu.appendChild(this.textEditPanel);
		this.bottomMenu.appendChild(this.updateTextPropWrap);
		this.bottomMenu.appendChild(this.updateDecorPropPanel);
		this.menus.push(this.stickersPanel);
		this.menus.push(this.decorsPanel);
		this.menus.push(this.textEditPanel);
		this.menus.push(this.updateDecorPropPanel);

		// subscribe to click events for deselecting items
		document.addEventListener('click', this.clickHandler.bind(this), false);
		// helping event and variable to prevent fail click during text selection inside text item
		document.addEventListener('mousedown', this.mouseDownHandler.bind(this), false);
		this.elementOnMouseDownEvent = this.canvas;

		// window.addEventListener('pointerup', this.notItemClickHandler.bind(this), false);	
		// window.addEventListener('pointerdown', this.pointerDownHandler.bind(this), false);
		// this.elementOnKeyDownEvent = {};	

		// add push buttons keyboard listener 
		document.addEventListener('keydown', this.keyDownBtnHandler.bind(this)/*, false*/);
		document.addEventListener('keyup', this.keyUpBtnHandler.bind(this)/*, false*/);
		// this.cntrlBtnIsPressed = 0;

		// subscribe for paste from Clipboard event 
		document.addEventListener('paste', this.pasteHandler.bind(this));
		document.addEventListener('cut', this.cutHandler.bind(this));
		document.addEventListener('drop', this.dropHandler.bind(this));	

		// subscribe mouse events on desktop
		document.addEventListener('mousemove', this.mouseMoveHandler.bind(this), false);
		document.addEventListener('mouseup', this.mouseUpHandler.bind(this), false);

		workspace.appendChild(this.topbar);
		workspace.appendChild(this.canvas);
		workspace.appendChild(this.cntrlBar);
		workspace.appendChild(this.bottomMenu);
		// workspace.appendChild(this.textEditPanel);
		// workspace.appendChild(this.updateTextPropWrap);

		//--------------------------------------------------
		// init topbar buttons

		let prevButtonStr = 'prev-btn';
		let nextButtonStr = 'next-btn';
		// Progress bar
		const topbarHTML = `
			<div class="${prevButtonStr} button">
				<span class="material-icons-outlined">
				chevron_left
				</span>
				Назад
			</div>
			<div class="${nextButtonStr} button">
				Далее
				<span class="material-icons-outlined">
				chevron_right
				</span>			
			</div>`;	
		this.topbar.innerHTML = topbarHTML;
		this.prevButton = this.topbar.querySelector("."+prevButtonStr);
		this.nextButton = this.topbar.querySelector("."+nextButtonStr);

		// prevButton.addEventListener('click',this.reloadApp.bind(this));
		this.prevButton.addEventListener('click',this.prevButtonHandler.bind(this),false);
		this.nextButton.addEventListener('click',this.nextButtonHandler.bind(this),false);

		//--------------------------------------------------
		// CONTROL PANEL BUTTONS
		
		// Progress bar
		this.cntrlBar.innerHTML = `
			<div class="${domStrings.addTextBtnStr} button">
				<span class="material-icons-outlined">
				add
				</span>
				Текст
			</div>
			<div class="${domStrings.addStickerBtnStr} button">
				<span class="material-icons-outlined">
				add
				</span>	
				Стикер
			</div>
			<div class="${domStrings.addDecorBtnStr} button">
				<span class="material-icons-outlined">
				add
				</span>	
				Декор
			</div>`;

		this.addTextBtn = this.cntrlBar.querySelector("."+domStrings.addTextBtnStr);
		this.addStickerBtn = this.cntrlBar.querySelector("."+domStrings.addStickerBtnStr);
		this.addStickerBtn.dataset.class = 'sticker';
		this.addDecorBtn = this.cntrlBar.querySelector("."+domStrings.addDecorBtnStr);
		this.addDecorBtn.dataset.class = 'decor';
		// this.addStickerBtn.innerHTML = artGlobSettings.userScreenHeight + 'px';

		this.addTextBtn.addEventListener('click',this.createNewItemClickHandler.bind(this),false);
		this.addStickerBtn.addEventListener('click',this.showStickersPanel.bind(this),false);
		this.addDecorBtn.addEventListener('click',this.showDecorsPanel.bind(this),false);

		//--------------------------------------------------
		// PICK STICKER PANEL 

		const svgStickersRequest = new Request({
			sendImmediate	: 'yes',
			type	: 'xml',
			method	: 'GET',
			url		: ieData.spritePath+ieData.spriteStickers,
			callbackOnSuccess 	: function(args, resonseData){ 
				this.graphicSprite = resonseData;
				this.renderGraphics('sticker');
			},	
			callbackOnError 	: function(args){ console.log('error'); },
			callbackScope		: this,
			callbackArgs		: artSettings
		});

		const svgDecorsRequest = new Request({
			sendImmediate	: 'yes',
			type	: 'xml',
			method	: 'GET',
			url		: ieData.spritePath+ieData.spriteDecors,
			callbackOnSuccess 	: function(args, resonseData){ 
				this.graphicSprite = resonseData;
				this.renderGraphics('decor');
			},	
			callbackOnError 	: function(args){ console.log('error'); },
			callbackScope		: this,
			callbackArgs		: artSettings
		});

		// this.stickersPanel.innerHTML = ``;

		//--------------------------------------------------
		// TEXT EDIT PANEL 

		this.textEditPanel.innerHTML = `
			<div data-role="${domStrings.textEditPanel.textEditBtn}" class="${domStrings.textEditPanel.editBtn} button">
				<span class="material-icons-outlined">
				keyboard
				</span>	
				<p>Изменить</p>
			</div>
			<div class="${domStrings.textEditPanel.editBtn} button"	
				data-role="${domStrings.textEditPanel.fontEditBtn}" 
				data-open="${domStrings.updateProperty.updateFontPanel}" 
			>
				<span class="material-icons-outlined">
				font_download
				</span>
				<p>Шрифт</p>
			</div>
			<div 
				class="${domStrings.textEditPanel.editBtn} button"
				data-role="${domStrings.textEditPanel.sizeEditBtn}"
				data-open="${domStrings.updateProperty.updateSizePanel}"
				> 
				<span class="material-icons-outlined">
				format_size
				</span>
				<p>Размер</p>
			</div>
			<div 
				class="${domStrings.textEditPanel.editBtn} button"
				data-role="${domStrings.textEditPanel.colorEditBtn}"
				data-open="${domStrings.updateProperty.updateColorPanel}"
			>
				<span class="material-icons-outlined">
				palette
				</span>
				<p>Цвет</p>
			</div>
			<div 
				class="${domStrings.textEditPanel.editBtn} button"
				data-role="${domStrings.textEditPanel.alignEditBtn}"
				data-open="${domStrings.updateProperty.updateAlignPanel}"
			>
				<span class="material-icons-outlined">
				format_align_center
				</span>
				<p>&nbsp;</p>				
			</div>`;		

		// EDIT BUTTON CLICK EVENTS
		// const textEditBtn = this.textEditPanel.querySelector("."+domStrings.textEditPanel.textEditBtn);
		// textEditBtn.addEventListener('click',this.openUpdateTextForm.bind(this),false);	

		// EDIT BUTTONS - SUBSCTIBE CLICK EVENTS
		const fontEditBtn = this.textEditPanel.querySelectorAll("."+domStrings.textEditPanel.editBtn);
		fontEditBtn.forEach(element => {
			element.addEventListener('click',this.clickEditBtnHandler.bind(this),false);	
		});

		// Set to element itself and all its descendant elements attribute data-class="text"
		atoms.setDataAttrToElementAndDescendants(this.textEditPanel, 'class', 'text');
		// set attr data-active to false (means closed) for the textEditPanel
		this.textEditPanel.dataset.active = false;
				
		//--------------------------------------------------
		// UPDATE PROPERTY PANEL

		this.updateTextPropWrap.innerHTML = `
			<div class="${domStrings.updateProperty.updateFontPanel}" data-menu='font'>
			</div>
			<div class="${domStrings.updateProperty.updateSizePanel}" data-menu='size'>
			</div>
			<div class="${domStrings.updateProperty.updateColorPanel}" data-menu='color'>
			</div>
			<div class="${domStrings.updateProperty.updateAlignPanel}" data-menu='align'>
			</div>`;
		this.bottomMenu.style.top = workspace.clientHeight + 'px';	
		// this.prevButton.innerHTML = workspace.clientHeight + 'px';	

		// UPDATE SIZE PANEL INNER HTML
		const updateSizePanel = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.updateSizePanel);
		updateSizePanel.innerHTML = 
				`<div class="${domStrings.updateProperty.fontSizeMinus} button" 
				role="${domStrings.updateProperty.fontSizeMinus}">
					<span class="material-icons-outlined">
						remove_circle_outline
					</span>
				</div>
				<div class="slider-bar font-size-slider">
					<div class="slider-bar-inner">
						<span class="slider-handle">						
						</span>
					</div>
				</div>
				<div class="${domStrings.updateProperty.fontSizePlus} button" 
				role="${domStrings.updateProperty.fontSizePlus}">
					<span class="material-icons-outlined">
						add_circle_outline
					</span>
				</div>
				<span class="size-hint"><span>`;


		this.fontStep = 2;
		this.initFontSize = 26/this.fontStep;	
		this.minFontSize = 10/this.fontStep;	

		updateSizePanel.classList.add(domStrings.updateProperty.active);
		this.fontSizeTuner = new Tuner({
			parent	: updateSizePanel,
			slider	: 'font-size-slider',
			handle	: "slider-handle",
			btnPlus	: domStrings.updateProperty.fontSizePlus,
			btnMinus: domStrings.updateProperty.fontSizeMinus,
			hint	: "size-hint",
			stepsQty: 30,
			callback: this.fontTune.bind(this),
		});
		updateSizePanel.classList.remove(domStrings.updateProperty.active);

		// UPDATE FONT PANEL INNER HTML

		// Loaded fonts object
		this.fonts = {};
		// default font for text items
		this.defaultFont = 'Montserrat';
		this.fontOptionHeight = 32;

		let fontPanelHtml = '<ul>';
		for (let index = 0; index < ieData.fonts.length; index++) {
			fontPanelHtml +=  `<li><span class="font-option" data-font="${ieData.fonts[index]}"></span></li>`; 
		}
		fontPanelHtml += '</ul>';
		this.updateFontPanel = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.updateFontPanel);
		this.updateFontPanel.innerHTML = fontPanelHtml;
		// set background style for all font options
		for (let index = 0; index < ieData.fonts.length; index++) {
			var fontOption = this.updateFontPanel.querySelector("[data-font='"+ieData.fonts[index]+"']");
			fontOption.dataset.num = index;
			if(ieData.fonts[index] === this.defaultFont){
				fontOption.dataset.active = true;
				// this.markPickedFont(fontOption);
			}
			fontOption.style.background = `
				url("${ieData.spritePath+ieData.spriteFonts}") no-repeat 0px -${this.fontOptionHeight*index}px 
			`;
			// subscribe click event for choosing font
			fontOption.addEventListener('click',this.pickFontHandler.bind(this),true);
		}		

		// subscribe click event for choosing font
		// this.updateFontPanel.addEventListener('click',this.pickFontHandler.bind(this),true);


		// UPDATE COLOR PANEL INNER HTML
		let colorPanelHtml = '<div class="pick-color-pallete">';
		for (let index = 0; index < ieStyles.colors.length; index++) {
			colorPanelHtml +=  `<div class="color-btn">
									<span class="color-option" 
									data-color="${ieStyles.colors[index].toUpperCase()}" 
									style="background:${ieStyles.colors[index]};">
									</span>
								</div>`; 
		}		
		colorPanelHtml += '</div>';
		this.updateColorPanel = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.updateColorPanel);
		this.updateColorPanel.innerHTML = colorPanelHtml;
		this.updateColorPanel.querySelector("[data-color='"+ieStyles.colors[0]+"']").classList.add('white');
		
		let colorOptions = this.updateColorPanel.querySelectorAll(".color-option");
		for (let index = 0; index < colorOptions.length; index++) {
			colorOptions[index].addEventListener('click', this.pickColorHandler.bind(this),false);
		}


		// UPDATE ALIGN PANEL INNER HTML
		let alignPanelHtml = `<div class="align-left-btn align">
								<span class="material-icons-outlined" data-align="left">
								format_align_left
								</span>
							</div>
							<div class="align-center-btn align">
								<span class="material-icons-outlined" data-align="center">
								format_align_center
								</span>
							</div>
							<div class="align-right-btn align">
								<span class="material-icons-outlined" data-align="right">
								format_align_right
								</span>
							</div>`;
		this.updateAlignPanel = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.updateAlignPanel);
		this.updateAlignPanel.innerHTML = alignPanelHtml;		
		
		let alignOptions = this.updateAlignPanel.querySelectorAll(".align span");
		for (let index = 0; index < alignOptions.length; index++) {
			alignOptions[index].addEventListener('click', this.pickAlignHandler.bind(this),false);
		}

		// Set to element itself and all its descendant elements attribute data-class="text"
		atoms.setDataAttrToElementAndDescendants(this.updateTextPropWrap, 'class', 'text');

		//----------------------------------------------------------------------------------------------
		// UPDATE TEXT FORM

		this.updateTextForm = atoms.createElement({ classes: 	["ie-update-text-form"] });		
		this.updateTextForm.innerHTML = `
			<div class="update-text-inner">
				<textarea class="${domStrings.updateTextForm.textArea}"></textarea>
				<div class="update-text-btns">
					<span class="${domStrings.updateTextForm.cancelBtn} button">Отмена</span>
					<span class="${domStrings.updateTextForm.updateBtn} button">Обновить</span>
				</div>
			</div>
		`;
		document.querySelector('body').appendChild(this.updateTextForm);
		this.updateTextForm.querySelector("."+domStrings.updateTextForm.updateBtn).addEventListener('click',this.updateText.bind(this),false);
		this.updateTextForm.querySelector("."+domStrings.updateTextForm.cancelBtn).addEventListener('click',this.closeUpdateForm.bind(this),false);
		// this.initUpdateTextForm();

		// variable to store Text Item Element which user clicked (to update)
		// this.selectedItem = {};

		//--------------------------------------------------
		// Canvas

		// canvas sizes and ratio
		this.canvasSidePadding = 10;
		this.canvas.style.padding = this.canvasSidePadding + 'px';
		this.maxImageHeight 	= this.canvas.clientHeight;
		this.maxImageWidth 	= this.canvas.clientWidth;
		this.canvasSizeRation = this.maxImageHeight/this.maxImageWidth;

		// Create img wrapper which left-upper corner  
		// will determine coordinates of all added blocks
		this.imageWrapper = atoms.createElement({				
			classes: 	["image-wrapper"]				
		});		

		// unset Loading Background
		
		// body.style.overflowY = "hidden";
		// body.style.height = "10px";

		// setTimeout(function () {
		// 	const children = body.children;
		// 	for (let index = 0; index < children.length; index++) {
		// 		if(!children[index].classList.contains(domStrings.ieApp)){
		// 			children[index].style.display = 'none';
		// 		}
		// 	}
		// },100);

		this.init({                    
			'imageEl'   : imageEl,
			// 'bg' 	    : this.loadingBG
		});
		
	}



	//--------------------------------------------------
	// INIT AND RESET APP

	init(options){
		const imageEl 	= options.imageEl.cloneNode(true);		
		// this.loadingBG = options.bg || null;
		artSettings.imgSrc 	= imageEl.getAttribute('data-src') || imageEl.getAttribute('src');
		artSettings.imgId 	= atoms.getImageId(imageEl);
		artSettings.items 	= {};

		//-------------------------------------------------------------------------
		// work with starting image

		// image sizes and ratio
		const imgWidth = parseInt(imageEl.getAttribute('width'));
		const imgHeight = parseInt(imageEl.getAttribute('height'));
		artSettings.originHeight = imgHeight;
		artSettings.originWidth = imgWidth;
		const imageSizeRation = imgHeight/imgWidth;
		
		// calculate and apply sizes of the image on the canvas
		if(this.canvasSizeRation > imageSizeRation){
			artSettings.renderedWidth = (this.maxImageWidth - 2*this.canvasSidePadding);
			imageEl.style.width = artSettings.renderedWidth + 'px';			
			imageEl.style.height = "auto";
			// imageEl.style.height = artSettings.renderedWidth*imageSizeRation + 'px';	
		} else {
			artSettings.renderedHeight = (this.maxImageHeight - 2*this.canvasSidePadding)
			imageEl.style.height = artSettings.renderedHeight + 'px';					
			imageEl.style.width = "auto";	
			// imageEl.style.width = artSettings.renderedHeight/imageSizeRation + 'px';	
		}	

		// reser imageWrapper editor-main-panel (canvas) and inner HTML
		this.imageWrapper.innerHTML = '';
		this.canvas.innerHTML = '';

		// create test text item for width calculation of the target item 
		this.testItem = atoms.createElement({				
			classes: 	[domStrings.itemType.text, domStrings.testItem]				
		});

		this.testItem.innerHTML = `<p class="${domStrings.textArea}"></p>`;

		// this.imageWrapper = atoms.createElement({				
		// 	classes: 	["image-wrapper"]				
		// });
		this.editorAppEl.classList.remove(domStrings.ieAppDeactive);
		this.imageWrapper.appendChild(imageEl);
		this.imageWrapper.appendChild(this.testItem);
		this.canvas.appendChild(this.imageWrapper);

		// get actuall rendered sizes of the image
		artSettings.renderedHeight = imageEl.offsetHeight;
		artSettings.renderedWidth = imageEl.offsetWidth;
		
		// positioning img at the center of the Y axis
		// this.imageWrapper.style.marginTop = (maxImageHeight - artSettings.renderedHeight)/2 + "px";
		this.imageWrapper.style.width = artSettings.renderedWidth + 'px';

		// set dynamic collection of art items
		artCollection.items = this.imageWrapper.getElementsByClassName(domStrings.artItem);

		scrollControl.disable();
		setTimeout(this.loadingBG.removeBG, 100);
		
	}

	//--------------------------------------------------
	// COMMON METHODS

	renderGraphics(type){
		this.graphicSpriteSrc = atoms.createElement({				
			classes: 	[type+"-sprite-bundle"]				
		});			
		this.graphicSpriteSrc.innerHTML = this.graphicSprite;
		this.editorAppEl.insertBefore(this.graphicSpriteSrc, this.editorAppEl.childNodes[0]);

		const svgEls = this.graphicSpriteSrc.querySelectorAll("svg");
		for (let i = 0; i < svgEls.length; i++) {			
			if(!svgEls[i].id) continue;
			var split = svgEls[i].id.split(/--/);
			svgEls[i].setAttribute('x',0);
			svgEls[i].setAttribute('y',0);
			// svgEls[i].dataset.topic = split[0];
			// svgEls[i].dataset.name = split[1];
			// var topic = split[0];
			// var name = split[1];

			var graphicOption = atoms.createElement({
				tag : 'span',
				classes : [type+'-option', 'option']
			});

			graphicOption.dataset.topic = split[0];
			graphicOption.dataset.name = split[1];
			graphicOption.dataset.id = svgEls[i].id;
			graphicOption.innerHTML = `<img src="${ieData.svgPath+split[0]+'/'+split[1]+'.svg'}" />`;

			// graphicOption.innerHTML = `<svg><use xlink:href="${ieData.spritePath+ieData.spritegraphics+'#'+svgEls[i].id}" /><svg>`;
			// graphicOption.style.background = "url("+ieData.spritePath+ieData.spritegraphics+'#'+svgEls[i].id+")";
			// graphicOption.classList.add('svg-' + svgEls[i].id); 
			// graphicOption.classList.add('svg-' + svgEls[i].id + '-doms'); 

			// graphicOption.appendChild(svgEls[i]);
			this.graphicPanel[type].appendChild(graphicOption);

			graphicOption.addEventListener('click', this.pickGraphic.bind(this), false);
			// set sticker-id to find parent svg after click within this svg
			// atoms.setDataAttrToElementAndDescendants(this.stickerOption, 'sticker_id', svgEls[i].id);
		}

		// Set to element itself and all its descendant elements attribute data-class="text"
		atoms.setDataAttrToElementAndDescendants(this.graphicPanel[type], 'class', type);

		if(type === 'decor'){
			//----------------------------------------------------------------------------------------------
			// UPDATE DECOR PROPERTY PANEL

			// DECOR OPACITY TUNER 
			this.updateDecorPropPanel.innerHTML = `
				<div class="decor-opacity-panel">
					<div class="${domStrings.updateProperty.opacityMinus} button" 
					role="${domStrings.updateProperty.opacityMinus}">
						<span class="material-icons-outlined">
							remove_circle_outline
						</span>
					</div>
					<div class="slider-bar opacity-slider">
						<div class="slider-bar-inner">
							<span class="slider-handle">						
							</span>
						</div>
					</div>
					<div class="${domStrings.updateProperty.opacityPlus} button" 
					role="${domStrings.updateProperty.opacityPlus}">
						<span class="material-icons-outlined">
							add_circle_outline
						</span>
					</div>
					<span class="opacity-hint"><span>
				</div>	
			`;

			this.opacityStep = 0.05;
			this.initOpacity = 0.9;	
			this.minOpacity = 0.05;	

			this.updateDecorPropPanel.classList.add(domStrings.activeClass);
			this.opacityTuner = new Tuner({
				parent	: this.updateDecorPropPanel,
				slider	: 'opacity-slider',
				handle	: "slider-handle",
				btnPlus	: domStrings.updateProperty.opacityPlus,
				btnMinus: domStrings.updateProperty.opacityMinus,
				hint	: "opacity-hint",
				stepsQty: parseInt((1 - this.minOpacity)/this.opacityStep)+1,
				callback: this.opacityTune.bind(this),
			});
			this.updateDecorPropPanel.classList.remove(domStrings.activeClass);	
			
			// DECOR COLOR PALETTE
			let updateDecorColorInnerHTML = '<div class="pick-color-pallete">';
			// Standart Colors  
			for (let index = 0; index < ieStyles.colors.length; index++) {
				updateDecorColorInnerHTML +=  `
					<div class="color-btn">
						<span class="color-option" 
						data-color="${ieStyles.colors[index].toUpperCase()}" 
						style="background:${ieStyles.colors[index]};">
						</span>
					</div>`; 
			}		
			// Colors From Decor Sprite
			let svgEls = this.graphicSpriteSrc.querySelectorAll("svg");
			for (let i = 0; i < svgEls.length; i++) {
				let fillColor = svgEls[i].querySelector('path').getAttribute('data-fill');	
				if(fillColor !== null){
					updateDecorColorInnerHTML +=  `
						<div class="color-btn">
							<span class="color-option" 
								data-color="${fillColor.toUpperCase()}" 
								style="background:${fillColor};">
							</span>
						</div>`; 				
				}			
			}	
			updateDecorColorInnerHTML += '</div>';		
			this.updateDecorPropPanel.insertAdjacentHTML('beforeend', updateDecorColorInnerHTML);		
			
			this.updateDecorPropPanel.querySelector("[data-color='"+ieStyles.colors[0]+"']").classList.add('white');
			
			let colorOptions = this.updateDecorPropPanel.querySelectorAll(".color-option");
			for (let index = 0; index < colorOptions.length; index++) {
				colorOptions[index].addEventListener('click', this.pickColorHandler.bind(this),false);
			}

			// Set to element itself and all its descendant elements attribute data-class="decor"
			atoms.setDataAttrToElementAndDescendants(this.updateDecorPropPanel, 'class', 'decor');
		}
		
	}

	fontTune(size){
		// console.log(size);
		let newFontSize = this.fontStep * (size  + this.minFontSize)
		if(this.selectedItem !== undefined){
			const textArea = this.selectedItem.querySelector("."+domStrings.textArea);
			artSettings.items[this.selectedItemId].settings.fontSize = newFontSize;
			this.selectedItem.dataset.size = newFontSize;
			this.selectedItem.selfObjRef.rerenderTextArea(textArea, artSettings.items[this.selectedItemId].settings, 0);
		}
	}

	opacityTune(opacity){
		let newOpacity = this.opacityStep * (opacity  + this.minOpacity/this.opacityStep);
		if(this.selectedItem !== undefined && this.selectedItem.dataset !== undefined){
			const svg = this.selectedItem.querySelector("."+domStrings.vectorImg);
			artSettings.items[this.selectedItemId].settings.opacity = newOpacity;
			this.selectedItem.dataset.opacity = newOpacity;
			svg.style.opacity = newOpacity;
		}
	}
	
	createNewItemClickHandler(e){
		this.createNewItem('text');
	}

	createNewItem(type, settings = {}){	
		settings.type = type;	
		switch (type) {
			case 'text':
				let textItem = new TextItem(this.itemCounter++, {
					parent 			: this.imageWrapper,
					testItem 		: this.testItem,					
					appObj			: this,
					settings		: settings,
				});
				break;
			case 'sticker':	
				let stickerItem = new StickerItem(this.itemCounter++, {					
					parent 			: this.imageWrapper,					
					appObj			: this,
					settings		: settings,
				});
				break;
			case 'decor':				
				let decorItem = new DecorItem(this.itemCounter++, {					
					parent 			: this.imageWrapper,					
					appObj			: this,
					settings		: settings,
				});	
			default:
				break;
		}		
	}


	updateMenu(targetMenu = {}){
		for (let index = 0; index < this.menus.length; index++) {
			if(targetMenu !== this.menus[index]){
				this.menus[index].classList.remove(domStrings.activeClass);
			}
		}
		if(targetMenu.dataset !== undefined && targetMenu.dataset.class !== undefined){
			targetMenu.classList.add(domStrings.activeClass);
			this.cntrlBar.style.visibility = "hidden";
		} else {
			let activePropMenu = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.active);
			if(activePropMenu) activePropMenu.classList.remove(domStrings.updateProperty.active);
			this.cntrlBar.style.visibility = "visible";
		}
		atoms.animateEl(this.bottomMenu,0,-this.bottomMenu.clientHeight,200);
		// move canvas if menu could overlap it
		if(this.selectedItem !== undefined){
			const itemCoord = this.selectedItem.getBoundingClientRect();	
			if((artGlobSettings.userScreenHeight - itemCoord.bottom) < this.bottomMenu.offsetHeight)	{
				this.moveWorkspace((artGlobSettings.userScreenHeight - itemCoord.bottom) - this.bottomMenu.offsetHeight);
			}	
		}
	}

	showStickersPanel(){		
		this.cntrlBar.style.visibility = "hidden";
		this.stickersPanel.classList.add(domStrings.activeClass);
		atoms.animateEl(this.bottomMenu,0,-this.stickersPanel.clientHeight,200);
	}	

	hideStickersPanel(){
		this.stickersPanel.classList.remove(domStrings.activeClass);
	}

	showDecorsPanel(){
		this.cntrlBar.style.visibility = "hidden";
		this.decorsPanel.classList.add(domStrings.activeClass);
		atoms.animateEl(this.bottomMenu,0,-this.decorsPanel.clientHeight,200);
	}

	hideDecorsPanel(){
		this.decorsPanel.classList.remove(domStrings.activeClass);
	}

	// showDecorsPropertyPanel(){
	// 	this.cntrlBar.style.visibility = "hidden";
	// 	this.updateDecorPropPanel.classList.add(domStrings.updateProperty.active)
	// 	atoms.animateEl(this.bottomMenu,0,-this.updateDecorPropPanel.clientHeight,200);
	// }

	// hideDecorsPropertyPanel(){
	// 	this.cntrlBar.style.visibility = "visible";
	// 	this.updateDecorPropPanel.classList.remove(domStrings.updateProperty.active);
	// 	atoms.animateEl(this.bottomMenu,0,0,200);		
	// }

	showTextEditPanel(){	
		// this.hideStickersPanel();	
		// this.hideDecorsPanel();	
		// this.hideDecorsPropertyPanel()
		this.updateMenu();
		this.cntrlBar.style.visibility = "hidden";
		this.textEditPanel.classList.add(domStrings.activeClass);
		atoms.animateEl(this.bottomMenu,0,-this.textEditPanel.clientHeight,200);
	}

	hideTextEditPanel(){
		this.cntrlBar.style.visibility = "visible";
		this.textEditPanel.dataset.active = false;
		this.textEditPanel.classList.remove(domStrings.activeClass);
		atoms.animateEl(this.bottomMenu,0,0,200);
		let propertyPanelActiveEl = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.active);
		if(propertyPanelActiveEl !== null) propertyPanelActiveEl.classList.remove(domStrings.updateProperty.active);
	}

	showUpdatePropertyPanel(propertyPanelEl){		
		// atoms.animateEl(this.updateTextPropWrap,0,0,50);	
		let panelHeight = propertyPanelEl.clientHeight;
		atoms.animateEl(this.bottomMenu,0,-(this.textEditPanel.clientHeight+panelHeight),200);
		this.updateTextPropWrap.dataset.active = true;
	}

	hideUpdatePropertyPanel(){
		// atoms.animateEl(this.updateTextPropWrap,0,0,50);	
		atoms.animateEl(this.bottomMenu,0,0,200);	
		this.updateTextPropWrap.dataset.active = false;
	}

	markPickedFont(fontOption, scroll = false){
		const prevFontOption = this.updateFontPanel.querySelector("[data-active='true']");
		if(prevFontOption !== null){
			prevFontOption.dataset.active = false;	
			prevFontOption.style.background = `
					url("${ieData.spritePath+ieData.spriteFonts}") no-repeat 0px -${this.fontOptionHeight*prevFontOption.dataset.num}px 
				`;
		}
		fontOption.dataset.active = true;	
		fontOption.style.background = `
			url("${ieData.spritePath+ieData.spriteFonts}") no-repeat -340px -${this.fontOptionHeight*fontOption.dataset.num}px 
		`;
		if(scroll){
			// this.updateFontPanel.scrollBy(0,fontOption.parentElement.offsetTop);
			this.updateFontPanel.childNodes[0].scrollTo(0,fontOption.parentElement.offsetTop - 2*this.fontOptionHeight);
		}
	}

	markPickedSize(sizeOption){
		this.fontSizeTuner.slide(parseInt(sizeOption/this.fontStep) - this.minFontSize);
	}

	markPickedColor(colorOption){
		if(colorOption.dataset.class === 'text'){
			var prevColorOption = this.updateColorPanel.querySelector("[data-active='true']");
		} else { // decor
			var prevColorOption = this.updateDecorPropPanel.querySelector("[data-active='true']");
		}
		if(prevColorOption !== null){
			prevColorOption.dataset.active = false;
		}
		colorOption.dataset.active = true;	
	}

	markPickedOpacity(opacityOption){		
		this.opacityTuner.slide(parseInt((opacityOption - this.minOpacity)/this.opacityStep));
	}

	markPickedAlign(alignOption){
		const prevAlignOption = this.updateAlignPanel.querySelector("[data-active='true']");
		if(prevAlignOption !== null){
			prevAlignOption.dataset.active = false;
		}
		alignOption.dataset.active = true;	
	}

	moveWorkspace(dist){
		this.currentDisplacement = dist;
		atoms.animateEl(this.canvas, 0, dist, 200);
		atoms.animateEl(this.topbar, 0, dist, 200);
	}

	deactivatetextEditBtn(){	
		let menuBtnActiveEl = this.textEditPanel.querySelector("."+domStrings.textEditPanel.active);
		if(menuBtnActiveEl !== null) menuBtnActiveEl.classList.remove(domStrings.textEditPanel.active);
	}

	//--------------------------------------------------
	// CUSTOM EVENTS HANDLERS

	selectItemEventHandler(){
		console.log("selectItemEvent");
		if( typeof this.selectedItem === undefined ){
			return;
		}
		if(this.selectedItem.dataset.class === "text"){
			if(this.updateTextPropWrap.dataset.active === 'true'){
				let activePropMenu = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.active);
				if(activePropMenu){
					switch (activePropMenu.dataset.menu) {
						case 'font':
							let fontOption = activePropMenu.querySelector("[data-font='"+this.selectedItem.dataset.font+"']");
							this.markPickedFont(fontOption, true);
							break;
						case 'size':
							// let sizeOption = activePropMenu.querySelector("[data-font='"+this.selectedItem.dataset.size+"']");
							this.markPickedSize(this.selectedItem.dataset.size, true);
							break;
						case 'color':
							if(typeof this.selectedItem.dataset.color !== "none"){
								let colorOption = activePropMenu.querySelector("[data-color='"+this.selectedItem.dataset.color.toUpperCase()+"']");
								this.markPickedColor(colorOption);	
							}
							break	
						case 'align':
							let alignOption = activePropMenu.querySelector("[data-align='"+this.selectedItem.dataset.align+"']");
							this.markPickedAlign(alignOption);	
							break					
						default:
							break;
					} 				
				}
			}
		} else if(this.selectedItem.dataset.class === "decor"){
			if(this.selectedItem.dataset.fill !== "none"){
				let colorOption = this.updateDecorPropPanel.querySelector("[data-color='"+this.selectedItem.dataset.fill.toUpperCase()+"']");
				this.markPickedColor(colorOption);	
			}
			this.markPickedOpacity(this.selectedItem.dataset.opacity);	
			this.updateMenu(this.updateDecorPropPanel);
			// this.showDecorsPropertyPanel();
		}
	}

	//--------------------------------------------------
	// MOUSE EVENTS HANDLERS

	mouseMoveHandler(e){
		// console.log('mouseMoveHandler');	
		let itemInMove = this.imageWrapper.querySelector('.'+domStrings.inMove);
		if(itemInMove){
			if(!itemInMove.selfObjRef.dragEn) return;
			// if(e.target.classList.contains(domStrings.artItem)){
				console.log('move');
				itemInMove.selfObjRef.delta = {
					x: e.clientX - itemInMove.selfObjRef.start.x,
					y: e.clientY - itemInMove.selfObjRef.start.y
				}
				itemInMove.selfObjRef.moveByDrag(itemInMove.selfObjRef.itemEl);
			// }
			e.preventDefault();
		}
		let resizeItem = this.imageWrapper.querySelector('.'+domStrings.resizing);
		if(resizeItem){
			// const resizeItem = e.target.parent;
			if(!resizeItem.selfObjRef.resizeEn) return;
			resizeItem.selfObjRef.deltaResize = {
				x: e.clientX - resizeItem.selfObjRef.startResize.x,	
				y: resizeItem.selfObjRef.startResize.y - e.clientY
			};
			resizeItem.selfObjRef.resize();
			e.preventDefault();
		}
	}

	mouseUpHandler(e){
		console.log('mouseUpHandler');
		let itemInMove = this.imageWrapper.querySelector('.'+domStrings.inMove);
		if(itemInMove){
			console.log('item in move found');
			itemInMove.selfObjRef.endMovement();
			e.preventDefault();
		} 
		let resizeItem = this.imageWrapper.querySelector('.'+domStrings.resizing);
		if(resizeItem){			
			resizeItem.selfObjRef.endResizeHandler(e);
			e.preventDefault();
		}
	}

	//--------------------------------------------------
	// CLICK HANDLERS

	pickGraphic(e){
		// console.log(e.target);
		if(e.target.parentElement.dataset.topic === undefined) return;

		const topic = e.target.parentElement.dataset.topic;
		const name = e.target.parentElement.dataset.name;		
		const pickedSvgEl = this.editorAppEl.querySelector('#'+e.target.parentElement.dataset.id);
		this.createNewItem(e.target.parentElement.dataset.class,{	
			width : pickedSvgEl.getAttribute("width"),
			height : pickedSvgEl.getAttribute("height"),
			fill : pickedSvgEl.querySelector('path').getAttribute('data-fill') || "none",
			topic : topic,
			name : name
 		});
	}

	pickFontHandler(e){
		var fontOption = e.target;
		if(e.target.dataset.font !== undefined){
			var pickedfontFamily = fontOption.dataset.font;
			var pickedFontName = fontOption.dataset.font.replace(/ /g, '');	
			let updateFont = () => {
				const textArea = this.selectedItem.querySelector("."+domStrings.textArea);
				artSettings.items[this.selectedItemId].settings.fontFamily = pickedfontFamily;
				this.selectedItem.selfObjRef.rerenderTextArea(textArea, artSettings.items[this.selectedItemId].settings, 0);	
				this.selectedItem.dataset.font = pickedfontFamily;
				this.markPickedFont(fontOption);
			}	
			var fonts = this.fonts;	
			// if font hasn't been loaded yet -> load this font
			if(fonts[pickedFontName] === undefined){
				fonts[pickedFontName] = new FontFace(pickedfontFamily, 'url('+ieData.fontsPath+pickedFontName+'.otf)');
				fonts[pickedFontName].load().then(function(loaded_face) {
					document.fonts.add(loaded_face);
					updateFont();
					//   document.body.style.fontFamily = '"Junction Regular", Arial';
				}).catch(function(error) {
					fonts[pickedFontName] = new FontFace(pickedfontFamily, 'url('+ieData.fontsPath+pickedFontName+'.ttf)');
					fonts[pickedFontName].load().then(function(loaded_face) {
						document.fonts.add(loaded_face);
						updateFont();
						//   document.body.style.fontFamily = '"Junction Regular", Arial';
					});
				});
								
			} else {
				updateFont();
			}
		}
	}

	pickColorHandler(e){
		let colorOption = e.target;
		let pickedColor = colorOption.dataset.color;
		if(e.target.dataset.class === 'text'){
			const textArea = this.selectedItem.querySelector("."+domStrings.textArea);
			textArea.style.color = pickedColor;
			artSettings.items[this.selectedItemId].settings.fontColor = pickedColor;
			this.selectedItem.dataset.color = pickedColor;
			this.markPickedColor(colorOption);
		} else { //decor
			artSettings.items[this.selectedItemId].settings.fill = pickedColor;
			this.selectedItem.style.fill = pickedColor;
			this.selectedItem.dataset.fill = pickedColor;
			this.markPickedColor(colorOption);
		}
	}

	pickAlignHandler(e){
		let alignOption = e.target;
		let pickedAlign = alignOption.dataset.align;
		const textArea = this.selectedItem.querySelector("."+domStrings.textArea);
		textArea.style.textAlign = pickedAlign;
		artSettings.items[this.selectedItemId].settings.textAlign = pickedAlign;		
		if(pickedAlign === 'right'){
			let startPos = this.selectedItem.selfObjRef.startPos;
			startPos.right = this.imageWrapper.offsetWidth - (startPos.left + this.selectedItem.offsetWidth);
			artSettings.items[this.selectedItemId].settings.posRight = startPos.right;
			this.selectedItem.style.right = startPos.right + "px";
			this.selectedItem.style.left = 'auto';			
		} 
		else {
			if(this.selectedItem.dataset.align === 'right'){
				let startPos = this.selectedItem.selfObjRef.startPos;
				startPos.left = this.imageWrapper.offsetWidth - (startPos.right + this.selectedItem.offsetWidth);
				artSettings.items[this.selectedItemId].settings.leftPos = startPos.left;
				this.selectedItem.style.left = startPos.left + "px";
				this.selectedItem.style.right = 'auto';		
			}	
		}
		this.selectedItem.dataset.align = pickedAlign;
		this.markPickedAlign(alignOption);
	}



	clickEditBtnHandler(e){
		let menuBtn = e.target;
		if(e.target.parentElement.classList.contains(domStrings.textEditPanel.editBtn)){
			menuBtn = e.target.parentElement;
		}

		// toggle active class for text menu panels
		this.deactivatetextEditBtn();

		// get corresponding update property panel
		let role = menuBtn.dataset.role;
		let propertyPanelClass = menuBtn.dataset.open;

		if(role === domStrings.textEditPanel.textEditBtn){
			this.openUpdateTextForm(e);
			return;
		} else {
			menuBtn.classList.add(domStrings.textEditPanel.active);
		}

		// toggle active class for text menu panels
		let propertyPanelActiveEl = this.updateTextPropWrap.querySelector("."+domStrings.updateProperty.active);
		if(propertyPanelActiveEl !== null) propertyPanelActiveEl.classList.remove(domStrings.updateProperty.active);
		let propertyPanelEl = this.updateTextPropWrap.querySelector("."+propertyPanelClass);
		propertyPanelEl.classList.add(domStrings.updateProperty.active);
	
		this.showUpdatePropertyPanel(propertyPanelEl);
				
		switch (role) {
			case domStrings.textEditPanel.fontEditBtn:
				const fontOption = this.updateFontPanel.querySelector("[data-font='"+artSettings.items[this.selectedItemId].settings.fontFamily+"']");
				this.markPickedFont(fontOption, true);
				break;			
			case domStrings.textEditPanel.sizeEditBtn:	
				this.markPickedSize(this.selectedItem.dataset.size, true);
				break;			
			case domStrings.textEditPanel.colorEditBtn:
				let colorOption = this.updateColorPanel.querySelector("[data-color='"+this.selectedItem.dataset.color.toUpperCase()+"']");
				this.markPickedColor(colorOption);
				break;
			case domStrings.textEditPanel.alignEditBtn:
				let alignOption = this.updateAlignPanel.querySelector("[data-align='"+this.selectedItem.dataset.align+"']");
				this.markPickedAlign(alignOption);
				break;	
		}
		const itemCoord = this.selectedItem.getBoundingClientRect();				
		if((artGlobSettings.userScreenHeight - itemCoord.bottom) < this.bottomMenu.offsetHeight)	{
			this.moveWorkspace((artGlobSettings.userScreenHeight - itemCoord.bottom) - this.bottomMenu.offsetHeight);
		}					
	}

	showResultScreen(args, resonseData){
		this.resultScreen = new ResultScreen({
			userRole : this.userRole,
			exitFunc : this.prevButtonHandler.bind(this)
		});
		this.resultScreen.setResultImg(resonseData.src);
		this.resultScreen.showDelay(resonseData.time);
		this.resultScreen.show();
		this.loadingBG.removeBG();
	}

	nextButtonHandler(){
		// TODO 1) escape special characters like quotes
		this.loadingBG.setBG();

		const request = new Request({
			sendImmediate	: 'yes',
			method	: 'POST',
			action	: 'ie_create_img',
			nonce	: serverData['nonce_ie'],	
			data	: {...artSettings, userRole	: this.userRole},
			callbackOnSuccess 	: this.showResultScreen,	
			// callbackOnSuccess 	: function(args, resonseData){ console.log('success'); console.log(this); console.log(args); console.log(resonseData);},	
			callbackOnError 	: function(args){ console.log('error'); console.log(this); console.log(args);},
			callbackScope		: this,
			callbackArgs		: artSettings
		});
	}

	prevButtonHandler(){	
		this.editorAppEl.classList.add(domStrings.ieAppDeactive);
		scrollControl.enable();
	}

	mouseDownHandler(e){
		let toogleMenu = (e) => {
			// Text
			if(this.updateTextPropWrap.dataset.active !== 'true'){
				if(e.target.classList.contains(domStrings.itemType.text) || e.target.parentElement.classList.contains(domStrings.itemType.text)){
					// this.hideDecorsPropertyPanel();	
					// this.hideDecorsPanel();
					// this.hideStickersPanel();
					this.updateMenu();
					this.showTextEditPanel();
				} 
			} 
			if(!e.target.classList.contains(domStrings.itemType.text) && !e.target.parentElement.classList.contains(domStrings.itemType.text)){
				// this.hideTextEditPanel();
				this.updateMenu();
			}
			// Decor
			if(!this.updateDecorPropPanel.classList.contains(domStrings.updateProperty.active)){
				if(e.target.classList.contains(domStrings.itemType.decor) || e.target.parentElement.classList.contains(domStrings.itemType.decor)){
					
					this.hideUpdatePropertyPanel();
					this.hideTextEditPanel();
					this.updateMenu(this.updateDecorPropPanel);
					// this.hideStickersPanel();
					// this.hideDecorsPanel();
					// this.showDecorsPropertyPanel();
					// this.hideUpdatePropertyPanel();
				} 
			} else {
				if(e.target.dataset.class !== 'decor'){
					// this.hideDecorsPropertyPanel();
					this.updateMenu();	
				}
			}
		}
		this.elementOnMouseDownEvent = e.target;
		if( e.target.classList.contains(domStrings.artItem)){
			e.target.selfObjRef.itemSelectClickHandler(e);	
			toogleMenu(e);		
		} 
		if(e.target.parentElement.classList.contains(domStrings.artItem)){		
			e.target.parentElement.selfObjRef.itemSelectClickHandler(e);	
			toogleMenu(e);		
		} 	
	}

	clickHandler(e){
		if((e.target.dataset.class !== 'text' && e.target.dataset.class !== 'sticker' && e.target.dataset.class !== 'decor') 
		|| e.target.classList.contains(domStrings.deleteBtn)){
			this.notItemClickHandler();
			this.moveWorkspace(0);
			this.deactivatetextEditBtn();
		}
		if((e.target.dataset.class !== 'text' && e.target.dataset.class !== 'sticker' && e.target.dataset.class !== 'decor') 
			|| e.target.classList.contains(domStrings.deleteBtn)){
			// this.hideTextEditPanel();
			// this.hideStickersPanel();
			// this.hideDecorsPanel();
			// this.hideUpdatePropertyPanel();
			// this.hideDecorsPropertyPanel();
			this.updateMenu();
			this.moveWorkspace(0);
			this.deactivatetextEditBtn();
		}
	}
		
	// Handler for untargeted click 
	notItemClickHandler(){		
		artCollection.unmarkOthers();
		
	}

	updateText(){
		const updateTextArea = this.updateTextForm.querySelector(".update-text-area");
		// const itemId = this.itemToUpdate.getAttribute(domStrings.itemId);
		artSettings.items[this.selectedItemId].settings.text = updateTextArea.value;
		const textArea = this.selectedItem.querySelector("."+domStrings.textArea);
		this.selectedItem.selfObjRef.rerenderTextArea(textArea, artSettings.items[this.selectedItemId].settings, 0);

		this.closeUpdateForm();
	}

	closeUpdateForm(){
		this.updateTextForm.style.display = 'none';
	}

	openUpdateTextForm(e){

		artSettings.items[this.selectedItemId].settings;

		const updateTextArea = this.updateTextForm.querySelector("."+domStrings.updateTextForm.textArea);
		updateTextArea.innerHTML = artSettings.items[this.selectedItemId].settings.text;
		updateTextArea.value = updateTextArea.innerHTML;

		this.updateTextForm.style.display = 'block';
	}

	//--------------------------------------------------
	// CLIPBOARD EVENTS HANDLERS

	pasteHandler(e){
		// console.log(e);	
		// if(e.target.classList.contains(domStrings.textArea) && this.pasteEventWasFiredRecently === 0){
		if(e.target.classList.contains(domStrings.textArea)){
			//  Art item data
			const textArea = e.target;	
			const artItem = textArea.parentElement;
			const itemId = artItem.getAttribute(domStrings.itemId);
			const itemSettings = artSettings.items[itemId].settings;

			// Get pasted data via clipboard API
			const clipboardData = e.clipboardData || window.clipboardData;
			const pastedData = clipboardData.getData('Text');

			// paste string from clipboard into text
			let cursorPos = textArea.selectionStart;
			let selectionEnd = textArea.selectionEnd;
			itemSettings.text = textArea.value.slice(0, cursorPos) + pastedData + textArea.value.slice(selectionEnd);
			cursorPos += pastedData.length;	

			// recalculate width and height of the textarea with new text and render it from scratch
			artItem.selfObjRef.rerenderTextArea(textArea, itemSettings, cursorPos);

			// window.removeEventListener('paste',this.pasteHandler.bind(this));
			e.preventDefault();	
			// this.pasteEventWasFiredRecently = 1;						
			// setTimeout(() => {this.pasteEventWasFiredRecently = 0;},50)
		}
	}

	cutHandler(e){

		if(e.target.classList.contains(domStrings.textArea)){
			//  Art item data
			const textArea = e.target;	
			const artItem = textArea.parentElement;
			const itemId = artItem.getAttribute(domStrings.itemId);
			const itemSettings = artSettings.items[itemId].settings;

			// cut string from clipboard into text
			let cursorPos = textArea.selectionStart;

			let rerenderTextAreaWithNewInput = () => {				
				itemSettings.text = textArea.value;
				artItem.selfObjRef.rerenderTextArea(textArea, itemSettings, cursorPos);
			}

			// recalculate and refresh width and height of the textarea with new text and upadte corresponding item settings
			setTimeout(rerenderTextAreaWithNewInput,300);
			// this.rerenderTextArea(textArea, itemSettings, cursorPos);
		}
	}

	//--------------------------------------------------
	// KEYBOARD BUTTON HANDLERS

	// key is down handler
	keyDownBtnHandler(e){
		console.log(e.key);		
		// console.log(this.cntrlBtnIsPressed);		
		const selectedItem = this.imageWrapper.querySelector("."+domStrings.selectedItem);
		let textArea = 0;	
		var itemSettings;	
		if(selectedItem){
			textArea = selectedItem.querySelector("."+domStrings.textArea);
			const selectedItemId = selectedItem.getAttribute(domStrings.itemId);
			itemSettings = artSettings.items[selectedItemId].settings;
		}
		if(textArea ){
			// if(this.cntrlBtnIsPressed === 0){
			if(!e.ctrlKey){
				let cursorPos = textArea.selectionStart;
				let selectionEnd = textArea.selectionEnd;				
				// if (e.key.match(/^[a-zA-Zа-яА-ЯёЁ0-9/|`№~,.;:!&()^%$#@*^"'{}+-=<>_]$/g) 
				if (e.key.length === 1
					|| e.key === 'Enter' 
					|| e.key === 'Backspace' 
					|| e.key === 'Delete' 
					// || e.key === ' '
					) {
					console.log("recalc");	
					switch (e.key) {
						case 'Enter':
							// Change height of the text area when new line was inserted
							// step size is determined by font size multiplying it by coef
							// itemSettings.linesNum++;
							itemSettings.text = textArea.value.slice(0, cursorPos) + '\r\n' + textArea.value.slice(selectionEnd);
							cursorPos += 1;
							break;
						case 'Backspace':								
							if(cursorPos === selectionEnd ){	
								if(cursorPos !== 0){
									itemSettings.text = textArea.value.slice(0, cursorPos-1) + textArea.value.slice(cursorPos);
									cursorPos -= 1;
								}
							} else {
								itemSettings.text = textArea.value.slice(0, cursorPos) + textArea.value.slice(selectionEnd);
							}						
							break;
						case 'Delete':	
							if(cursorPos === selectionEnd ){							
								itemSettings.text = textArea.value.slice(0, cursorPos) + textArea.value.slice(cursorPos+1);
							} else {
								itemSettings.text = textArea.value.slice(0, cursorPos) + textArea.value.slice(selectionEnd);							
							}
							break;	
						// case ' ':	
						// 	itemSettings.text = textArea.value.slice(0, cursorPos) + e.key + textArea.value.slice(selectionEnd);
						// 	cursorPos += 1;
						// 	break;	
						default:
							itemSettings.text = textArea.value.slice(0, cursorPos) + e.key + textArea.value.slice(selectionEnd);
							cursorPos += 1;				
							break;
					}	
					
					// recalculate and refresh width and height of the textarea with new text and upadte corresponding item settings
					selectedItem.selfObjRef.rerenderTextArea(textArea, itemSettings, cursorPos);//.bind(textArea.self);

					// prevent default keypress actions for certain keys
					e.preventDefault();	
					
				}
			} else {
				//
			}
		}
		// if (e.key === 'Control'){
			// this.cntrlBtnIsPressed = 1;
		// }
	}
	// key is up handler
	keyUpBtnHandler(e){
	// 			if (e.key === 'Control'){
	// 		console.log('control unpressed');		
	// 		this.cntrlBtnIsPressed = 0;
	// 	}
	}	

	//--------------------------------------------------
	// Drag&Drop handle events

	dropHandler(e){
		// Disable Drag&Drop
		e.preventDefault();
	}

}
