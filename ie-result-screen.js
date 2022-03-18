import { Atoms } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { artCollection, artSettings } from './ie-art.js';
import { Request } from '../modules/request.js';
import { artGlobSettings } from './ie-art.js';

const atoms = new Atoms();

export class ResultScreen{

	constructor(options = {}){

		this.userRole = options.userRole || 'visitor';
		this.exitFunc = options.exitFunc || {};
		
		// RESULT SCREEN WRAPPER 
		this.resultScreen =  atoms.createElement({				
			classes: 	["result-screen"]				
		});

		this.resultScreen.innerHTML =`<div class="title">Ваша открытка готова</div>`;

		// RESULT IMAGE
		this.resultImg =  atoms.createElement({				
			classes: 	["result-img"]				
		});		

		this.resultScreenBtns =  atoms.createElement({				
			classes: 	["result-btns"]				
		});

		// DOWNLOAD BUTTON
		this.downloadBtn =  atoms.createElement({
			tag : 'a',				
			classes: 	["download-btn","btn"]				
		});
		this.downloadBtn.setAttribute("download","");
		this.downloadBtn.innerHTML = "Скачать"

		// SAVE MEDIA LIBRARY BUTTON
		this.saveMediaLibBtn =  atoms.createElement({
			tag : 'a',				
			classes: 	["save-medialib-btn","btn"]				
		});
		this.saveMediaLibBtn.setAttribute("download","");
		this.saveMediaLibBtn.innerHTML = "В медиа библ."
		this.saveMediaLibBtn.addEventListener("click", this.saveToMediaLibHandler.bind(this), false);

		// MODIFY BUTTON
		this.modifyBtn =  atoms.createElement({
			tag : 'a',				
			classes: 	["modify-btn","btn"]				
		});
		this.modifyBtn.setAttribute("download","");
		this.modifyBtn.innerHTML = "Редактировать"
		this.modifyBtn.addEventListener("click", this.modifyHandler.bind(this), false);

		// EXIT BUTTON
		this.exitBtn =  atoms.createElement({
			tag : 'a',				
			classes: 	["exit-btn","btn"]				
		});
		this.exitBtn.setAttribute("download","");
		this.exitBtn.innerHTML = "Выход"
		this.exitBtn.addEventListener("click", this.exitHandler.bind(this), false);
		
		this.resultScreenBtns.appendChild(this.downloadBtn);
		if(this.userRole !== 'visitor'){
			this.resultScreenBtns.appendChild(this.saveMediaLibBtn);
		}
		this.resultScreenBtns.appendChild(this.modifyBtn);
		this.resultScreenBtns.appendChild(this.exitBtn);
		
		this.resultScreen.appendChild(this.resultImg);
		this.resultScreen.appendChild(this.resultScreenBtns);

	}

	setResultImg(src){
		this.src = src;
		this.resultImg.innerHTML =`<img src="${this.src}">`;
		this.downloadBtn.setAttribute("href", this.src);
	}

	showDelay(time){
		this.resultScreen.insertAdjacentHTML('beforeend', '<div>'+time+' секунд</div>');
	}

	show(){
		document.body.appendChild(this.resultScreen);
	}

	saveToMediaLibHandler(){
		const request = new Request({
			sendImmediate	: 'yes',
			method	: 'POST',
			action	: 'save_img_to_media_lib',
			nonce	: serverData['nonce_ie'],	
			data	: {imgSrc: this.src, userRole : this.userRole},
			callbackOnSuccess 	: function (args, resonseData) {
				console.log(resonseData); 
			},	
			// callbackOnSuccess 	: function(args, resonseData){ console.log('success'); console.log(this); console.log(args); console.log(resonseData);},	
			callbackOnError 	: function(args){ 
				console.log('error'); 
				// console.log(this); 
				console.log(args);
			},
			callbackScope		: this,
			callbackArgs		: artSettings
		});
	}

	modifyHandler(){
		this.resultScreen.remove();
	}

	exitHandler(){
		this.resultScreen.remove();
		this.exitFunc.call();
	}

}
