import { Atoms } from '../atoms.js';
import { domStrings } from './ie-dom.js';
import { artCollection, artSettings } from './ie-art.js';
import { artGlobSettings } from './ie-art.js';
import { Item } from './ie-item.js';
import { GraphicItem } from './ie-graphic-item.js';
const atoms = new Atoms();

export class DecorItem extends GraphicItem{

	constructor(id, options){		
		super(id, options);		
	}

}
