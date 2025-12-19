const mongoose = require('mongoose');
const db = require('../config/db.js');
const Amenity = require('../models/Amenity.model.js');

const Amenities = [
  // Nhóm tiện nghi phổ biến
  { name: 'Wi-Fi miễn phí', description: 'Kết nối internet tốc độ cao miễn phí.' },
  { name: 'TiVi', description: 'Tiện nghi giải trí với tivi.' },
  { name: 'Điều hòa nhiệt độ', description: 'Phòng có máy điều hòa nhiệt độ.' },
  { name: 'Máy giặt', description: 'Tiện nghi giặt là tại chỗ.' },
  { name: 'Bếp / khu vực nấu ăn', description: 'Khu vực nấu ăn hoặc bếp đầy đủ tiện nghi.' },
  { name: 'Tủ lạnh', description: 'Tủ lạnh để bảo quản thực phẩm.' },
  { name: 'Không gian làm việc riêng', description: 'Góc làm việc yên tĩnh và riêng tư.' },
  { name: 'Chỗ để xe máy / ô tô', description: 'Bãi đậu xe an toàn cho xe máy hoặc ô tô.' },

  // Nhóm tiện nghi nổi bật (tuỳ chọn)
  { name: 'Ban công / sân nhỏ', description: 'Có ban công hoặc sân nhỏ để thư giãn.' },
  { name: 'Bồn tắm', description: 'Phòng có bồn tắm để thư giãn.' },
  { name: 'Hồ bơi', description: 'Hồ bơi chung cho cư dân.' },
  { name: 'Phòng gym chung', description: 'Phòng tập thể dục chung trong khuôn viên.' },
  { name: 'Khu vực ăn uống ngoài trời', description: 'Khu vực để ăn uống ngoài trời.' },

  // Nhóm an toàn
  { name: 'Máy báo khói', description: 'Thiết bị cảnh báo khói trong phòng.' },
  { name: 'Bình chữa cháy', description: 'Bình chữa cháy an toàn trong khu vực.' },
  { name: 'Bộ sơ cứu', description: 'Bộ dụng cụ sơ cứu cơ bản.' },

  //Bổ sung thêm
  { name: 'Gác lửng', description: 'Phòng có gác lửng.' },
  { name: 'Vệ sinh trong', description: 'Nhà vệ sinh khép kín trong phòng.' },
  { name: 'Phòng tắm', description: 'Có phòng tắm riêng.' },
  { name: 'Bình nóng lạnh', description: 'Trang bị bình nước nóng.' },
  { name: 'Giường nệm', description: 'Có giường và nệm.' },
  { name: 'Tủ áo quần', description: 'Tủ đựng quần áo.' },
  { name: 'Thang máy', description: 'Có thang máy trong tòa nhà.' },
  { name: 'Camera an ninh', description: 'Camera an ninh khu vực chung.' },
  { name: 'Sân vườn', description: 'Không gian sân vườn.' },

  //Môi trường xung quanh
  { name: 'Gần chợ', description: 'Khu trọ nằm gần chợ, thuận tiện mua sắm.' },
  { name: 'Gần siêu thị', description: 'Có siêu thị gần khu vực sinh sống.' },
  { name: 'Gần bệnh viện', description: 'Dễ dàng tiếp cận các cơ sở y tế.' },
  { name: 'Gần trường học', description: 'Phù hợp cho học sinh, sinh viên.' },
  { name: 'Gần công viên', description: 'Không gian xanh, thuận tiện thư giãn.' },
  { name: 'Gần bến xe Bus', description: 'Thuận tiện di chuyển bằng xe buýt.' },
  { name: 'Gần trung tâm thể dục thể thao', description: 'Dễ dàng tập luyện và rèn luyện sức khỏe.' }
];

const seedAmenities = async () => {
  try {
    await db.connectDB();
    console.log('Database connected for seeding amenities.');

    console.log('Inserting new blog amenities...');
    const result = await Amenity.default.insertMany(Amenities);
    console.log(`${result.length} blog amenities have been successfully seeded.`);
    return result;
  } catch (error) {
    console.error('Error seeding blog amenities:', error);
    throw new Error(`Error seeding blog amenities: ${error.message}`);
  } finally {
    console.log('Disconnecting database.');
    mongoose.disconnect();
  }
};

seedAmenities();