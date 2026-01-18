# Context dự án
- Kịch bản 1 server vps vật lý
- 1 backend aspnet core
- 1 frontend reactjs
- BE chỉ có 1 endpoint get timezone /api/server-information
- FE chỉ gọi duy nhất 1 endpoint này
- FE expose ra browser và internet
- BE không expose ra internet. 
- Deploy k3s (k8s phiên bản nhẹ hơn)
- api /api/server-information trả về utc time. client_secret và GG_Client_Id là biến trong appsetting
- Mỗi FE và BE có 2 replicate.
- Bởi vì kịch bản này chỉ có 1 server - tức là 1 node. nên sẽ ko cần external load balance.

# Requirement: 
- Check k3s đã cài chưa ?
- Có set up algo cd chưa ? 
- User sẽ manual config algocd (không cần cài)
- Triển khai dự án chuẩn production doanh nghiệp
- Cập nhật theo context dự án bên trên
- Tổ chức dự án chuẩn doanh nghiệp
- Ở local. Cho tôi lệnh set secrect.
- Tôi muốn thấy 1 dự án có đầy đủ các file yml deployment, ingress, service, config map (cho GG_Client_Id), secrets(cho client_secret), hpa scale (ví dụ trên 50% ram thì tạo thêm pod. limit 5 pod backend)
- Tạo 2 image trên docker hub. Kiểm tra đã login chưa thì login.
- Sau khi build và push. Commit code và đẩy. Tôi sẽ xem thử algo cd chạy ra sao !


# Output
- Summary ngắn: Algo cd mở port nào, FE mở port nào. cách kiểm tra nếu có thể
- Đánh giá nhanh về flow hiện tại ổn chưa
- User có thể mở FE trên browser.
- FE có thể gọi BE hoạt động tốt
- Có 1 md flow về kiến trúc. ví dụ sơ đồ của app này càng tốt. 

# Flow cho CICD
1. Build image mới
2. Push image lên registry
3. Run DB migration (trước khi deploy)
4. Update deployment.yaml với tag mới
5. Git push → ArgoCD sync

# step setup apply root-app.yml