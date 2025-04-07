
export function getUrlParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

