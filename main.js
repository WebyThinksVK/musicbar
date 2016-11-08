if (window.location.host.match("vk.com")) {
    script = document.createElement("script");
    script.setAttribute("src", "https://www.youtube.com/iframe_api");
    script.setAttribute("async", "true");
    document.head.appendChild(script);
}

