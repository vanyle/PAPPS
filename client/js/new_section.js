async function loadNew() {
    title_input_dom.addEventListener('keyup', function(){
        document.querySelector('.recipe-title').innerHTML = text_formatter(this.value);
    });

    description_input_dom.addEventListener('keyup', function(){
        document.querySelector('.recipe-description').innerHTML = text_formatter(this.value);
    });
}

set_load_section_event('new',loadNew);