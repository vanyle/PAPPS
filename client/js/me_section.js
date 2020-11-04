function loadMe(){
	deco_button.onclick = async (e) => {
		await deconnect();
		location.hash = "";
		location.reload();
	}
}

set_load_section_event('me',loadMe);