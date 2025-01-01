
import axios from 'axios';
const baseURL = 'http://localhost:9090'

const instance = axios.create({
  baseURL,
  timeout: 100000
})

export default instance