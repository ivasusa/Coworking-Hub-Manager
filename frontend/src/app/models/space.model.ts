export class Space {
  _id: string = ""
  name: string = ""
  city: string = ""
  address: string = ""
  description: string = ""
  companyId: any = null
  managerId: any = null
  pricePerHour: number = 0
  status: string = ""
  mainImage: string = ""
  images: string[] = []
  latitude: number = 0
  longitude: number = 0
  maxPenalties: number = 0
  totalLikes: number = 0
  totalDislikes: number = 0
  createdAt: string = ""
  elements: SpaceElement[] = []
}

export class SpaceElement {
  _id: string = ""
  spaceId: string = ""
  type: string = ""
  name: string = ""
  deskCount: number = 0
  equipment: string = ""
}

export class Reservation {
  _id: string = ""
  memberId: string = ""
  spaceId: any = null
  elementId: any = null
  startTime: string = ""
  endTime: string = ""
  status: string = ""
  createdAt: string = ""
}
