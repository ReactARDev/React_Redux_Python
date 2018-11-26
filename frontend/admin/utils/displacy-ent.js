/* eslint-disable */
//- ----------------------------------
//- 💥 DISPLACY ENT
//- ----------------------------------

'use strict';

export default class DisplaCyENT {
    constructor (api, options) {
        this.api = api;
        this.container = document.querySelector(options.container || '#displacy');
        this.defaultModel = options.defaultModel || 'en';
        this.defaultEnts = options.defaultEnts || ['person', 'org', 'gpe', 'loc', 'product'];
        this.onStart = options.onStart || false;
        this.onSuccess = options.onSuccess || false;
        this.onError = options.onError || false;
        this.onRender = options.onRender || false;
    }

    render(text, spans, ents, sentence_offset=0) {
        this.container.innerHTML = '';
	let start_at_offset = {};
	let end_at_offset   = {};
	let entity_by_id    = {};

        spans.forEach( args => {
	    //console.log(args);
	    const type      = args[0];
	    const start     = args[1];
	    const end       = args[2]-1;
	    const span_text = text.slice(start, end+1);
	    const abs_start = sentence_offset + start;
	    const abs_end   = sentence_offset + end;
	    const span_id   = type + '_' + abs_start.toString() + '_' + abs_end.toString();
	    if (!(start in start_at_offset)) { start_at_offset[start] = [ ]; }
	    if (!(end in end_at_offset)) { end_at_offset[end] = [ ]; }
	    start_at_offset[start].push(span_id);
	    end_at_offset[end].push(type);
	    entity_by_id[span_id] = {
		'label':     args[0].toLowerCase(),
		'start':     abs_start,
		'end':       abs_end,
		'span_id':   span_id,
		'span_text': span_text
	    };
	    if (type === 'FEATURE') { entity_by_id[span_id]['score'] = args[3]; }
        });
	let open_fragment = '';
        for (let offset = 0; offset < text.length; offset++) {
	    let cur_char = text.slice(offset,offset+1);
	    if (offset in end_at_offset) {
		end_at_offset[offset].forEach( type => {
		    if (type === 'FEATURE') {
			cur_char += '</span>';
		    } else {
			cur_char += '</mark>';
		    }
		})
	    }
	    if (offset in start_at_offset) {
		start_at_offset[offset].forEach(span_id => {
		    //console.log(span_id);
		    const label     = entity_by_id[span_id]['label'];
		    const span_text = entity_by_id[span_id]['span_text'];
		    const score     = entity_by_id[span_id]['score'];
		    if (label === 'feature') {
			if (score >= 0.0) {
			    cur_char = '<span class="token_hilite" span_id="' + span_id +
				'" style="background-color:rgba(0, 255, 0, '+ score + ')' +
				'" feature-score=' + score + '>' +
			        '<span class="feature_score">' + score + '</span>' + cur_char;
			} else {
			    cur_char = '<span class="token_hilite" span_id="' + span_id +
				'" style="background-color:rgba(255, 0, 0, '+ score + ')' +
				'" feature-score=' + score + '>' +
				'<span class="feature_score">' + score + '</span>' + cur_char;
			}
		    } else {
			cur_char = '<mark data-entity="' + label +
			    '" class="unselected_span" span_id="' + span_id +
			    '" span_text="' + span_text +
			    '">' + cur_char;
		    }
		});
	    }
	    open_fragment += cur_char;
	}
        this.container.insertAdjacentHTML( 'beforeend', open_fragment );
        if(typeof this.onRender === 'function') this.onRender();
	return entity_by_id;
    }

}
