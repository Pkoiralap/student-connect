import axios from "axios";
const BASE_URL = "http://localhost:8529/_db/student_connect/api"

const postProcess = async fn => {
    try {
        const value = await fn();
        return {
            success: true,
            data: value.data,
            status: value.status,
            status_text: value.statusText
        }
    } catch(err) {
        return {
            success: false,
            err,
        }
    } 
}

export const getAPI = (url) => {
    return postProcess(() => axios.get(`${BASE_URL}/${url}`));
}

export const postAPI = (url, value) => {
    return postProcess(() => axios.post(`${BASE_URL}/${url}`, value));
}

export const putAPI = (url, value) => {
    return postProcess(() => axios.put(`${BASE_URL}/${url}`, value));
}

export const patchAPI = (url, value) => {
    return postProcess(() => axios.put(`${BASE_URL}/${url}`, value));
}

export const deleteAPI = (url) => {
    return postProcess(() => axios.delete(`${BASE_URL}/${url}`));
}