import request from "../utils/request";


export function getFriends(userId) {
  return request({
    url: `/api/friends/${userId}`,
    method: "get",    
  });
}
export function searchFriend(username) {
  return request({
    url: `/api/search?username=${username}`,
    method: "get",    
  });
}

export function addFriend(data){
  return request({
    url:`/api/friends/${data.userID}/add/${data.friendID}`,
    method:"post",
    data:data,
  })
}




