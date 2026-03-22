export class User {
  _id: string = ""
  username: string = ""
  firstName: string = ""
  lastName: string = ""
  phone: string = ""
  email: string = ""
  profileImage: string = ""
  role: string = ""
  status: string = ""
  companyId: any = null
  createdAt: string = ""
}

export class Company {
  _id: string = ""
  name: string = ""
  address: string = ""
  registrationNumber: string = ""
  taxId: string = ""
  managerCount: number = 0
}

export class AuthResponse {
  token: string = ""
  user: any = null
}
