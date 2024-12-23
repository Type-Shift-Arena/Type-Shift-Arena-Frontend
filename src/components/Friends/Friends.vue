<template>
   <div class="friend">
        <div class="my">
          <div class="my-info">
            <a-avatar  :src="userInfo.avatarUrl" :size="50">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span>{{ userInfo.nickname }}</span>
          </div>
          <div class="search-btn" @click="isSearch=!isSearch">
            <user-add-outlined />
          </div>
        </div>

        <div class="firend-list">
          <div class="list-items" v-for="item in friendsList " :key="item.id">
              <a-avatar 
                class="items-avatar"      
                :src="item.imgUrl"
                :size="50"
              >
                <user-outlined />
              </a-avatar>
              <span>{{item.name}}</span>
              <div class="inv-btn" @click="invToGame(item.id)">
                <plus-outlined />
              </div>
            </div>
        </div>
      </div> 
      <teleport to="body">
        <Search v-if="isSearch" ></Search>
      </teleport>
</template>

<script setup>
import { inject, ref,onMounted, provide } from "vue";
import Search from "./Search.vue";
import { getFriends,searchFriend,addFriend } from "@/api/friends";
const friendsList=ref([])
let isSearch = ref(false)
const userId=Number(localStorage.getItem('userId'))
console.log(userId);
const userInfo = inject('userInfo') 


onMounted(() => {
  getFriendsList(userId)
});

const getFriendsList=async (userId)=>{
  console.log(userId);
  try{
    const res = await getFriends(userId)
    if(!res.data.status){
      friendsList.value=[]
      const friendsData=res.data.data
      friendsData.forEach(item=>{
        friendsList.value.push({
          id:item.id,
          name:item.username,
          imgUrl:item.imgSrc|| null,
        })
      })
    
    }

  }catch(error){
    console.error(error)
  }
  
}
provide('getFriendsList',getFriendsList)

//待补充，邀请进入游戏
const invToGame=(id)=>{
  
  console.log(id);
}

</script>

<style lang="scss" scoped>
  .friend {
    position: absolute;
    color: black;
    top: 80px;
    right: 100px ;
    width: 250px;
    height: 600px;
    // background-color: #ffffff;
    // background-color: #F4F4F4;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    .firend-list {
      width: 100%;
      height: calc(100% - 80px);
      // background-color: antiquewhite;
      overflow-y: auto;
      .list-items:hover{
          background-color: rgba(139, 138, 138, 0.6);
        }
      .list-items{
        width: 100%;
          height: 70px;
          display: flex;
          align-items: center;
          // background-color: lightgray;
          gap: 10px;
          font-size: 20px;
          position: relative;
          
          .items-avatar{
            margin-left: 20px;
          }
          .inv-btn{
            position: absolute;
            right: 30px;
            width: 35px;
            height: 35px;
            background-color: rgba(139, 138, 138, 0.25);
            border: none;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
          }
          .inv-btn:hover{
            background-color: rgba(139, 138, 138, 0.5);
          }

      }
    }
    .my {
      height: 80px;
      width: 100%;

      display: flex;
      align-items: center;
      position: relative;
      .search-btn {
        width: 30px;
        height: 30px;
        background-color: #e9e9e9;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        bottom: 10px;
        right: 30px;
        border-radius: 5px;
        cursor: pointer;
      }
      .search-btn:hover {
        background-color: #c0c0c0;
      }
      .my-info {
        height: 50px;
        display: flex;
        font-size: 24px;
        gap: 10px;
      }
    }
  }
</style>
