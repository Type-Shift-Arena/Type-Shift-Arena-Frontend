<template>
  <div class="add">
    <div class="search">
      <a-input-search
        class="search-input"
        v-model:value="fname"
        placeholder="请输入用户名称"
        style="width: 250px"
        @search="searchFriends"
      />
    </div>

    <div class="serach-list">
      <div class="list-item">
        <div class="item-detail" v-for="item in searchList" :key="item.id">
          <a-avatar class="detail-avatar" :src="item.imgUrl" :size="50">
            <user-outlined />
          </a-avatar>
          <span>{{ item.name }}</span>
          <div class="add-btn" @click="handleAdd(item.id)">
            <usergroup-add-outlined />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive,inject} from "vue";
import { useRouter } from "vue-router";
import { getFriends,searchFriend,addFriend } from "@/api/friends";
const fAddForm=ref({
  userID:'',
  friendID:'',
})
const getFriendsList = inject('getFriendsList');
const fname = ref('');
const searchList=ref([])
const userId=Number(localStorage.getItem('userId'))

const searchFriends=async(fname)=>{
  try{
    const res = await searchFriend(fname)
    if(!res.data.status){
      console.log(res);
      // searchList.value=[]
      searchList.value.length = 0;
      const searchData= res.data.data
      searchData.forEach(item=>{
        searchList.value.push({
          id:item.id,
          name:item.username,
          imgUrl:item.imgSrc,
        })
      })

    }else{
      alert('无此用户')
      
    }
  }catch(error){
    console.error(error)
  }
}
    
const handleAdd= async (addId)=>{
  fAddForm.value={userID:userId,friendID:addId}
  try{
    const res = await addFriend(fAddForm.value)
    alert(res.data.message)
    if(!res.data.status){
      getFriendsList(userId)
    }
   
  }catch(error){
    console.error(error)
  }

}

</script>

<style lang="scss" scoped>
.add {
  width: 300px;
  height: 250px;

  background-color: #2c3e50;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  background-color: rgba(99, 116, 151, 0.25);
  backdrop-filter: blur(9px) saturate(180%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.125);
  display: flex;
  flex-direction: column;
  .serach-list {
    width: 100%;
    height: calc(100% - 70px);
    // background-color: lightblue;
    .list-item {
      width: 100%;
      height: 100%;
      // background-color: lightpink;
      overflow: auto;
      .item-detail:hover {
        background-color: rgba(139, 138, 138, 0.25);
      }
      .item-detail {
        width: 100%;
        height: 70px;
        display: flex;
        align-items: center;
        // background-color: lightgray;
        gap: 10px;
        font-size: 20px;
        position: relative;
        .detail-avatar {
          margin-left: 10px;
        }
        .add-btn {
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
        .add-btn:hover {
          background-color: rgba(139, 138, 138, 0.5);
        }
      }
    }
  }
  .search {
    width: 100%;
    height: 70px;
    // background-color: #2c3e50;
    display: flex;
    align-items: center;
    // background-color: beige;
    .search-input {
      padding-left: 30px;
      :deep(.ant-input) {
        background-color: #e2e3eb;
        color: rgb(100, 98, 98);
      }
      :deep(.ant-input-search-button) {
        background-color: #e2e3eb;
      }
    }
  }
}
</style>
