module jgengine {
	export interface UpdateLog {
		type:number;
		t:number;
		events:jg.InputEvent[];
	}

	//base serializer
	export class Serializer {
		constructor() {
		}

		serialize(log:UpdateLog):any {
			throw "not implemented";
		}

		deserialize(data:any):UpdateLog {
			throw "not implemented";
		}
	}
}