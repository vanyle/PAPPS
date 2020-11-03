async function loadConnect() {
    login_button.onclick = async (e) => {
        e.preventDefault(); // prevent form from submitting.
        let name = login_username.value;
        let pass = login_password.value;
        console.log("Co:",name,pass);
        let res = await login(name,pass);
        console.log(res);
        if(res.co === 'OK'){
            location.hash = '';
            location.reload();
        }else{
            login_result.innerHTML = "Mauvais identifiants";
            login_result.style.display = '';
        }
    }
}

set_load_section_event('connect',loadConnect);