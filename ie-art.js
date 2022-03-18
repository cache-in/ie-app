import { domStrings } from './ie-dom.js';
// set dynamic collection of art items

export let artGlobSettings = {
	userDevice			: 'mobile',
	appleMobileDevice	: false
};

export let artCollection = {
	items			: {},
	unmarkOthers	: unmarkOthers
};

function unmarkOthers(exceptItemId = -1){
	let collection = artCollection.items;
	// console.log('unmarkOtherArtItems except'+exceptItemId);
	for (let i = 0; i < collection.length; i++) {
		if(exceptItemId != collection[i].getAttribute(domStrings.itemId)){
			collection[i].classList.remove(domStrings.selectedItem);
			// collection[i].removeEventListener('drop', this.dropHandler.bind(this));
			// collection[i].removeEventListener('paste', this.pasteHandler.bind(this));
			// collection[i].removeEventListener('copy', this.copyHandler.bind(this));
			// collection[i].removeEventListener('cut', this.cutHandler.bind(this));
		}
	}	
}

//-----------------------------------------------------
// Applied settings of the user's art 
export let artSettings =
{	
	imgSrc 	: '',
	imgId 	: '',
	items 	: {},
	save	: save,
}

// Save art item's settings
function save(itemId, settings){
	artSettings.items[itemId] = {
		id:				itemId,		
		settings:		settings,
	};	
}